import { HttpService } from "@rbxts/services";
import BlockManager from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";
import BuildingWelder from "./BuildingWelder";
import BuildingWrapper from "./BuildingWrapper";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for controlling the buildings server-side on player requests */
export const RequestBuildingController = {
	placeBlocks: (player: Player, request: PlaceBlocksRequest): MultiBuildResponse => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const block of request.blocks) {
			if (block.uuid !== undefined) {
				return errInvalidOperation;
			}
		}

		return BuildingController.placeBlocks(request);
	},
	moveBlocks: (player: Player, request: MoveBlocksRequest): Response => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}

		if (SharedBuilding.isBlocks(request.blocks)) {
			for (const block of request.blocks) {
				if (!SharedPlots.isBlockOnAllowedPlot(player, block)) {
					return errBuildingNotPermitted;
				}
			}
		}

		return BuildingController.moveBlocks(request);
	},
	logicConnect: (player: Player, request: LogicConnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.outputBlock)) {
			return errBuildingNotPermitted;
		}

		return BuildingController.logicConnect(request);
	},
	logicDisconnect: (player: Player, request: LogicDisconnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}

		return BuildingController.logicDisconnect(request);
	},
} as const;

/** Methods for controlling the buildings server-side */
export const BuildingController = {
	placeBlocks: (request: PlaceBlocksRequest): MultiBuildResponse => {
		const models: BlockModel[] = [];

		for (const block of request.blocks) {
			const response = BuildingWrapper.placeBlock({
				plot: request.plot,
				...block,
			});

			if (!response.success) {
				return response;
			}

			models.push(response.model as BlockModel);
		}

		return {
			success: true,
			models,
		};
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
			BuildingWelder.unweldFromOtherBlocks(block);
			block.PivotTo(block.GetPivot().add(diff));
			BuildingWelder.weld(block);
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
