import { Players } from "@rbxts/services";
import Machine from "client/blocks/Machine";
import SoundController from "client/controller/SoundController";
import Gui from "client/gui/Gui";
import RideModeScene, { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import PlayMode from "client/modes/PlayMode";
import SharedPlots from "shared/building/SharedPlots";

export default class RideMode extends PlayMode {
	private currentMachine?: Machine;
	private readonly rideModeScene;

	constructor() {
		super();

		this.rideModeScene = new RideModeScene(Gui.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode);
		this.add(this.rideModeScene);
	}

	getName(): PlayModes {
		return "ride";
	}

	getCurrentMachine() {
		return this.currentMachine;
	}

	onImmediateSwitchToNext(mode: PlayModes | undefined): void {
		this.currentMachine?.destroy();
		this.currentMachine = undefined;
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		if (prev === undefined) {
			//
		} else if (prev === "build") {
			this.currentMachine = new Machine();
			this.currentMachine.init(
				SharedPlots.getPlotBlockDatas(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId)),
			);

			SoundController.getSounds().Start.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
