import AbstractBlock from "shared/registry/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import Remotes from "shared/NetworkDefinitions";
import Logger from "shared/Logger";
import DiscordWebhook from "../network/DiscordWebhook";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import CollisionMaker from "./CollisionMaker";

/** Class for **server-based** construction management from blocks, e.g. block installation/painting/removal */
export default class BuildEvent {
	static initialize(): void {
		Logger.info("Loading Build event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) =>
			this.playerPlaceBlock(player, data),
		);
	}

	private static playerPlaceBlock(player: Player, data: PlayerPlaceBlockRequest): BuildResponse {
		if (!BlockRegistry.Blocks.has(data.block)) {
			return {
				success: false,
				message: "Block not found",
			};
		}

		if (!BuildingManager.vectorAbleToPlayer(data.location.Position, player)) {
			return {
				success: false,
				message: "You are not allowed to place blocks here",
			};
		}

		// Create a new instance of the building model
		const block = BlockRegistry.Blocks.get(data.block) as AbstractBlock;
		const model = block.getModel().Clone();

		if (model.PrimaryPart === undefined) {
			DiscordWebhook.send(
				"**ERROR**: PrimaryPart is undefined for block **" +
					data.block +
					"**\nCalled by: **" +
					player.Name +
					"**",
			);

			// Delete block from game database (prevent discord spamming)
			BlockRegistry.Blocks.delete(data.block);

			return {
				success: false,
				message: "Block is corrupted. Contact game developer",
			};
		}

		const plot = SharedPlots.getPlotByPosition(data.location.Position) as Model;
		model.PivotTo(data.location);
		model.SetAttribute("isBlock", true);
		model.Parent = plot.FindFirstChild("Blocks");

		CollisionMaker.makeJoints(model);

		return { success: true, message: undefined };
	}
}
