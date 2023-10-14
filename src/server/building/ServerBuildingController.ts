import { Workspace } from "@rbxts/services";
import Remotes from "shared/definitions/Remotes";
import Logger from "shared/Logger";
import BlocksBehavior from "shared/building/BlocksBehavior";
import { ErrorMessages } from "shared/Messages";

/** Class for **server-based** construction management from blocks, e.g. block installation/painting/removal */
export default class ServerBuildingController {
	static initialize(): void {
		Logger.info("Loading Building controller..");

		// Block place network event
		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) => {
			if (!BlocksBehavior.blockExists(data.block)) {
				return {
					success: false,
					message: ErrorMessages.INVALID_BLOCK.message,
				};
			}

			// Create a new instance of the building model
			const model = (BlocksBehavior.getBlockByName(data.block) as Block).uri.Clone();

			if (model.PrimaryPart === undefined) {
				Logger.info("ERROR: " + ErrorMessages.INVALID_PRIMARY_PART.message + ": " + data.block);
				return {
					success: false,
					message: ErrorMessages.INVALID_PRIMARY_PART.message + ": " + data.block,
				};
			}

			// TODO: Make this work for multiple players
			model.PrimaryPart.PivotTo(data.location);
			model.Parent = Workspace;

			return { success: true, message: undefined };
		});
	}
}
