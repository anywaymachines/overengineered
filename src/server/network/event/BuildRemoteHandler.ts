import BlockRegistry from "shared/registry/BlocksRegistry";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import BuildingWrapper from "server/BuildingWrapper";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";

/** Class for **server-based** construction management from blocks */
export default class BuildRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("build");

		Remotes.Server.GetNamespace("Building").OnFunction("PlaceBlockRequest", (player, data) =>
			this.emit(player, data),
		);
	}

	public emit(player: Player, data: PlaceBlockRequest): BuildResponse {
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
