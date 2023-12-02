import BuildingWelder from "server/BuildingWelder";
import ServerPlots from "server/plots/ServerPlots";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";

export default class DeleteEvent {
	static initialize(): void {
		Logger.info("Loading Delete event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("Delete", (player, data) =>
			this.playerDeleteBlocks(player, data),
		);
	}

	private static playerDeleteBlocks(player: Player, blocks: PlayerDeleteBlockRequest): BuildResponse {
		if (blocks === "all") {
			const parentPlot = SharedPlots.getPlotByOwnerID(player.UserId);
			ServerPlots.clearAllBlocks(parentPlot);

			return { success: true };
		}

		for (const block of blocks) {
			const parentPlot = SharedPlots.getPlotByBlock(block);

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

			BuildingWelder.unweld(block);
			block.Destroy();
		}

		return { success: true };
	}
}
