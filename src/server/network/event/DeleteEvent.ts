import ServerPlots from "server/plots/ServerPlots";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";

export default class DeleteEvent {
	static initialize(): void {
		Logger.info("Loading Delete event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerDeleteBlock", (player, data) =>
			this.playerDeleteBlock(player, data),
		);

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerClearAll", (player) => this.playerClearAll(player));
	}

	private static playerDeleteBlock(player: Player, data: PlayerDeleteBlockRequest): BuildResponse {
		const parentPlot = SharedPlots.getPlotByBlock(data.block);

		// No plot?
		if (parentPlot === undefined) {
			return {
				success: false,
				message: "Plot not found",
			};
		}

		// Plot is forbidden
		if (!BuildingManager.isBuildingAllowed(parentPlot, player)) {
			return {
				success: false,
				message: "Building is not permitted",
			};
		}

		data.block.Destroy();

		return {
			success: true,
		};
	}

	private static playerClearAll(player: Player) {
		const parentPlot = SharedPlots.getPlotByOwnerID(player.UserId);

		ServerPlots.clearAllBlocks(parentPlot);

		return {
			success: true,
		};
	}
}
