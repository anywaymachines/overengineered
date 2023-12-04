import BuildingWrapper from "server/BuildingWrapper";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import Remotes from "shared/Remotes";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";

export default class ConfigRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("config");

		Remotes.Server.GetNamespace("Building").OnFunction("UpdateConfigRequest", (player, data) =>
			this.emit(player, data),
		);
	}

	public emit(player: Player, data: ConfigUpdateRequest): Response {
		const parentPlot = SharedPlots.getPlotByBlock(data.block);
		print("received  " + data.data.key + " " + data.data.value);

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
