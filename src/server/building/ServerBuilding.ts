import { HttpService } from "@rbxts/services";
import { blockRegistry } from "shared/Registry";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import { AABB } from "shared/fixes/AABB";
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
		const uuid =
			"uuid" in data && data.uuid !== undefined ? data.uuid : (HttpService.GenerateGUID(false) as BlockUuid);
		if (SharedPlots.tryGetBlockByUuid(plot, uuid)) {
			throw "Block with this uuid already exists";
		}

		const block = blockRegistry.get(data.id)!;

		// round the coordinates
		(data as Writable<typeof data>).location = data.location.sub(
			data.location.Position.sub(VectorUtils.apply(data.location.Position, math.round)),
		);

		// Create a new instance of the building model
		const model = block.model.Clone();
		model.SetAttribute("id", data.id);

		model.PivotTo(data.location);

		// Set material & color
		if ("config" in data && Objects.keys(data.config).size() !== 0) {
			model.SetAttribute("config", JSON.serialize(data.config));
		}

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
	deleteBlocks: ({ plot, blocks }: DeleteBlocksRequest): Response => {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		if (blocks === "all") {
			plot.Blocks.ClearAllChildren();
		} else {
			for (const block of blocks) {
				BuildingWelder.deleteWeld(plot, block);
				block.Destroy();
			}
		}

		return success;
	},
	moveBlocks: ({ plot, blocks, diff }: MoveBlocksRequest): Response => {
		if (SharedBuilding.getBlockList(blocks).size() === 0) {
			return success;
		}

		let blocksRegion = SharedBuilding.isFullPlot(blocks) ? AABB.fromModel(blocks) : AABB.fromModels(blocks);
		blocksRegion = blocksRegion.withCenter(blocksRegion.getCenter().add(diff));

		blocks = SharedBuilding.getBlockList(blocks);
		if (!SharedPlots.getPlotBuildingRegion(plot).contains(blocksRegion)) {
			return err("Invalid movement");
		}

		for (const block of blocks) {
			block.PivotTo(block.GetPivot().add(diff));

			// TODO:: not unweld moved blocks between them
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
