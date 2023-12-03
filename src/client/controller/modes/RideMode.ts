import PlayMode from "./PlayMode";
import RideModeScene, { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import GuiController from "../GuiController";

export default class RideMode extends PlayMode {
	constructor() {
		super();

		const rideMode = new RideModeScene(GuiController.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode);
		this.add(rideMode);
	}

	getName(): PlayModes {
		return "ride";
	}
}
