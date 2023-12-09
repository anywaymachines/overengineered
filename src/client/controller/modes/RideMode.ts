import Machine from "client/blocks/logic/Machine";
import RideModeScene, { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import GuiController from "../GuiController";
import SoundController from "../SoundController";
import PlayMode from "./PlayMode";

export default class RideMode extends PlayMode {
	private currentMachine?: Machine;
	private readonly rideModeScene;

	constructor() {
		super();

		this.rideModeScene = new RideModeScene(
			GuiController.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode,
		);
		this.add(this.rideModeScene);
	}

	getName(): PlayModes {
		return "ride";
	}

	getCurrentMachine() {
		return this.currentMachine;
	}

	public onSwitchToNext(mode: PlayModes | undefined) {
		this.currentMachine?.destroy();
		this.currentMachine = undefined;
	}
	public onSwitchFromPrev(prev: PlayModes | undefined) {
		if (prev === "build") {
			this.currentMachine = Machine.fromBlocks();
			SoundController.getSounds().RideMode.RideStart.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
