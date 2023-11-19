import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import Remotes from "shared/NetworkDefinitions";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import PartUtils from "shared/utils/PartUtils";

/** Class for **server-based** construction management from blocks */
export default class BuildEvent {
	static initialize(): void {
		Logger.info("Loading Build event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) =>
			this.playerPlaceBlock(player, data),
		);
	}

	private static playerPlaceBlock(player: Player, data: PlayerPlaceBlockRequest): BuildResponse {
		if (BlockRegistry.Blocks.has(data.block) === false) {
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
		model.SetAttribute("blockid", data.block);

		if (model.PrimaryPart === undefined) {
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

		// Set material
		PartUtils.switchDescendantsMaterial(model, data.material);
		model.SetAttribute("material", data.material.Name);

		// Make transparent glass materials
		if (data.material === Enum.Material.Glass) {
			PartUtils.switchDescendantsTransparency(model, 0.3);
		}

		return { success: true, model: model };
	}
}
