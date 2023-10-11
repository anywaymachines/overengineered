import { Workspace } from "@rbxts/services";
import Remotes from "shared/definitions/Remotes";
import BuildingModels from "shared/building/BuildingModels";

Remotes.Server.OnFunction("PlayerPlaceBlock", (player: Player, arg0: PlayerPlaceBlockRequest) => {
	if (!BuildingModels.isModelExists(arg0.block)) {
		return {
			success: false,
			message: "Could not find building model " + arg0.block,
		};
	}

	// Create a new instance of the building model
	const model = BuildingModels.getBuildingModel(arg0.block).Clone();

	if (model.PrimaryPart === undefined) {
		return {
			success: false,
			message: "Could not find primary part of " + arg0.block,
		};
	}

	// TODO: Make this work for multiple players
	model.PrimaryPart.PivotTo(arg0.location);
	model.Parent = Workspace;

	return { success: true, message: undefined };
});
