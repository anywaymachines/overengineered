import { ReplicatedStorage } from "@rbxts/services";

export default class BuildingModels {
	static getBuildingModel(placeable: string): Model {
		const foundModel = ReplicatedStorage.WaitForChild("Placeable").FindFirstChild(placeable);

		if (foundModel) {
			return foundModel as Model;
		} else {
			error("Could not find building model " + placeable);
		}
	}

	static isModelExists(placeable: string): boolean {
		return ReplicatedStorage.WaitForChild("Placeable").FindFirstChild(placeable) !== undefined;
	}
}
