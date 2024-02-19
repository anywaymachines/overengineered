import { HttpService } from "@rbxts/services";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for controlling the buildings server-side on player requests */
export const RequestBuildingController = {
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
