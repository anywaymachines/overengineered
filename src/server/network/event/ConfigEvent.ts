import { HttpService } from "@rbxts/services";
import BuildingWrapper from "server/BuildingWrapper";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";

export default class ConfigEvent {
	static initialize(): void {
		Logger.info("Loading Config event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("UpdateConfigRequest", (player, data) =>
			this.playerUpdateConfig(player, data),
		);
	}

	private static playerUpdateConfig(player: Player, data: ConfigUpdateRequest): Response {
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

		const response = BuildingWrapper.updateConfig(data);

		return response;
	}
}
