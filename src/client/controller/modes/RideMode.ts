import { Players } from "@rbxts/services";
import Machine from "client/blocks/Machine";
import RideModeScene, { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import SharedPlots from "shared/building/SharedPlots";
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
		if (prev === undefined) {
			//
		} else if (prev === "build") {
			this.currentMachine = new Machine();
			this.currentMachine.init(
				SharedPlots.getPlotBlockDatas(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId)),
			);

			SoundController.getSounds().RideMode.RideStart.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
