import { Workspace } from "@rbxts/services";
import Block from "shared/abstract/Block";
import BlockRegistry from "shared/building/BlocksRegistry";
import Remotes from "shared/definitions/Remotes";
import Logger from "shared/Logger";
import { ErrorMessages } from "shared/Messages";

/** Class for **server-based** construction management from blocks, e.g. block installation/painting/removal */
export default class ServerBuildingController {
	static initialize(): void {
		Logger.info("Loading Building controller..");

		// Block place network event
		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) => {
			if (!BlockRegistry.Blocks.has(data.block)) {
				return {
					success: false,
					message: ErrorMessages.INVALID_BLOCK.message,
				};
			}

			// Create a new instance of the building model
			const block = BlockRegistry.Blocks.get(data.block) as Block;
			const model = block.getModel().Clone();

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
