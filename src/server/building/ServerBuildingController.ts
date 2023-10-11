import { Workspace } from "@rbxts/services";
import Remotes from "shared/definitions/Remotes";
import BuildingModels from "shared/building/BuildingModels";
import Logger from "shared/Logger";

export default class ServerBuildingController {
	static initialize(): void {
		// Block place network event
		Remotes.Server.GetNamespace("Building").OnFunction("PlayerPlaceBlock", (player, data) => {
			if (!BuildingModels.isModelExists(data.block)) {
				Logger.info("(ERR) Could not find building model " + data.block);
				return {
					success: false,
					message: "Could not find building model " + data.block,
				};
			}

			// Create a new instance of the building model
			const model = BuildingModels.getBuildingModel(data.block).Clone();

			if (model.PrimaryPart === undefined) {
				Logger.info("(ERR) PrimaryPart is undefined in " + data.block);
				return {
					success: false,
					message: "Could not find primary part of " + data.block,
				};
			}

			// TODO: Make this work for multiple players
			model.PrimaryPart.PivotTo(data.location);
			model.Parent = Workspace;

			return { success: true, message: undefined };
		});
	}
}
