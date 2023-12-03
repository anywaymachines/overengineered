import Machine from "client/blocks/logic/Machine";
import RideModeScene, { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import BlockLogicController from "../BlockLogicController";
import GuiController from "../GuiController";
import SoundController from "../SoundController";
import PlayMode from "./PlayMode";

export default class RideMode extends PlayMode {
	private currentMachine?: Machine;

	constructor() {
		super();

		const rideMode = new RideModeScene(GuiController.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode);
		this.add(rideMode);
	}

	getName(): PlayModes {
		return "ride";
	}

	public onSwitchTo(mode: PlayModes | undefined) {
		this.currentMachine?.destroy();
		this.currentMachine = undefined;
	}
	public onSwitchFrom(prev: PlayModes | undefined) {
		if (prev === "build") {
			this.currentMachine = BlockLogicController.setupBlocks();
			this.currentMachine.initializeSeat();

			SoundController.getSounds().RideMode.RideStart.Play();
		}
	}
}
