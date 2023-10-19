import Block from "shared/registry/Block";
import BlockRegistry from "shared/registry/BlocksRegistry";
import Remotes from "shared/network/Remotes";
import Logger from "shared/Logger";
import DiscordWebhook from "../network/DiscordWebhook";
import PlotManager from "shared/plots/PlotManager";

/** Class for **server-based** construction management from blocks, e.g. block installation/painting/removal */
export default class BuildEvent {
	static initialize(): void {
		Logger.info("Loading Build event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) => {
			if (!BlockRegistry.Blocks.has(data.block)) {
				return {
					success: false,
					message: "Block not found",
				};
			}

			if (!PlotManager.vectorAbleToPlayer(data.location.Position, player)) {
				return {
					success: false,
					message: "You are not allowed to place blocks here",
				};
			}

			// Create a new instance of the building model
			const block = BlockRegistry.Blocks.get(data.block) as Block;
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

			const plot = PlotManager.getPlotByPosition(data.location.Position) as Model;
			model.PrimaryPart.PivotTo(data.location);
			model.Parent = plot.FindFirstChild("Blocks");

			return { success: true, message: undefined };
		});
	}
}
