import BlockRegistry from "shared/registry/BlocksRegistry";
import Remotes from "shared/Remotes";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import BuildingWrapper from "server/BuildingWrapper";

/** Class for **server-based** construction management from blocks */
export default class BuildEvent {
	static initialize(): void {
		Logger.info("Loading Build event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlaceBlockRequest", (player, data) =>
			this.playerPlaceBlock(player, data),
		);
	}

	private static playerPlaceBlock(player: Player, data: PlaceBlockRequest): BuildResponse {
		// Check is in plot
		if (!BuildingManager.vectorAbleToPlayer(data.location.Position, player)) {
			return {
				success: false,
				message: "Out of bounds",
			};
		}

		// Check is limit exceeded
		const plot = SharedPlots.getPlotByPosition(data.location.Position) as Model;
		const block = BlockRegistry.Blocks.get(data.block)!;
		const placedBlocks = SharedPlots.getPlotBlocks(plot)
			.GetChildren()
			.filter((placed_block) => {
				print(placed_block.GetAttribute("id") + " " + data.block);
				return placed_block.GetAttribute("id") === data.block;
			})
			.size();
		if (placedBlocks >= block.getLimit()) {
			return {
				success: false,
				message: "Type limit exceeded",
			};
		}

		const response = BuildingWrapper.placeBlock(data);
		return response;
	}
}
