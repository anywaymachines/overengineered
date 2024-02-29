import { HttpService } from "@rbxts/services";
import { blockRegistry } from "shared/Registry";
import BlockManager from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import JSON from "shared/fixes/Json";
import Objects from "shared/fixes/objects";
import VectorUtils from "shared/utils/VectorUtils";
import BuildingWelder from "./BuildingWelder";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for editing the buildings server-side */
export const ServerBuilding = {
	clearPlot: (plot: PlotModel): void => {
		plot.Blocks.ClearAllChildren();
		BuildingWelder.deleteWelds(plot);
	},
	placeBlock: (plot: PlotModel, data: PlaceBlockByPlayerRequest | PlaceBlockByServerRequest): BuildResponse => {
		const block = blockRegistry.get(data.id)!;

		// Create a new instance of the building model
		const model = block.model.Clone();
		model.SetAttribute("id", data.id);

		model.PivotTo(data.location);

		// Set material & color
		if ("config" in data && Objects.keys(data.config).size() !== 0) {
			model.SetAttribute("config", JSON.serialize(data.config));
		}

		const uuid = "uuid" in data ? data.uuid : HttpService.GenerateGUID(false);
		// TODO: remove attribute uuid because Name exists?
		model.SetAttribute("uuid", uuid);
		model.Name = uuid;

		SharedBuilding.paint({ blocks: [model], color: data.color, material: data.material }, true);

		model.Parent = plot.Blocks;

		// Weld block
		const newJoints = BuildingWelder.weldOnPlot(plot, model);
		/*if (newJoints.size() !== 0) {
			PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
				if (part.Name.lower() === "colbox") return;
				part.Anchored = false;
			});

			for (const part of newJoints) {
				if (part.AssemblyRootPart?.Parent === model) continue;

				PartUtils.applyToAllDescendantsOfType("BasePart", part.AssemblyRootPart!.Parent!, (part) => {
					part.Anchored = false;
				});
			}

			if (!model.PrimaryPart!.AssemblyRootPart!.Anchored) {
				model.PrimaryPart!.Anchored = true;
			}
		}*/

		return { success: true, model: model };
	},
	moveBlocks: ({ plot, blocks, diff }: MoveBlocksRequest): Response => {
		let blocksRegion = SharedBuilding.isFullPlot(blocks)
			? BuildingManager.getModelAABB(blocks)
			: BuildingManager.getBlocksAABB(blocks);
		blocksRegion = new Region3(
			blocksRegion.CFrame.Position.sub(blocksRegion.Size.div(2)).add(diff),
			blocksRegion.CFrame.Position.add(blocksRegion.Size.div(2)).add(diff),
		);

		blocks = SharedBuilding.getBlockList(blocks);
		const plotregion = SharedPlots.getPlotBuildingRegion(plot);

		if (!VectorUtils.isRegion3InRegion3(blocksRegion, plotregion)) {
			return err("Invalid movement");
		}

		for (const block of blocks) {
			// TODO:: not unweld moved blocks between them
			block.PivotTo(block.GetPivot().add(diff));
			BuildingWelder.moveCollisions(plot, block, block.GetPivot());
		}

		return success;
	},
	logicConnect: (request: LogicConnectRequest): Response => {
		const inputInfo = BlockManager.getBlockDataByBlockModel(request.inputBlock);
		const outputInfo = BlockManager.getBlockDataByBlockModel(request.outputBlock);

		const connections: BlockData["connections"] = {
			...inputInfo.connections,
			[request.inputConnection]: {
				blockUuid: outputInfo.uuid,
				connectionName: request.outputConnection,
			},
		};

		request.inputBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		return success;
	},
	logicDisconnect: (request: LogicDisconnectRequest): Response => {
		const inputInfo = BlockManager.getBlockDataByBlockModel(request.inputBlock);

		const connections = { ...inputInfo.connections };
		if (connections[request.inputConnection]) {
			delete connections[request.inputConnection];
		}

		request.inputBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		return success;
	},
} as const;
