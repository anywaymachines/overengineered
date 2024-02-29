import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import { ServerBuilding } from "./ServerBuilding";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for editing the buildings server-side on player requests */
export const ServerBuildingRequestHandler = {
	placeBlocks: (player: Player, request: PlaceBlocksRequest): MultiBuildResponse => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const block of request.blocks) {
			if (block.uuid !== undefined) {
				return errInvalidOperation;
			}
		}

		return ServerBuilding.placeBlocks(request);
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

		return ServerBuilding.moveBlocks(request);
	},
	logicConnect: (player: Player, request: LogicConnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.outputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicConnect(request);
	},
	logicDisconnect: (player: Player, request: LogicDisconnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicDisconnect(request);
	},
} as const;
