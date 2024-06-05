import { Machine } from "client/blocks/Machine";
import { SoundController } from "client/controller/SoundController";
import { Gui } from "client/gui/Gui";
import { RideModeScene } from "client/gui/ridemode/RideModeScene";
import { PlayMode } from "client/modes/PlayMode";
import type { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import type { PlayerDataStoragee } from "client/PlayerDataStorage";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class RideMode extends PlayMode {
	private currentMachine?: Machine;
	private readonly rideModeScene;

	constructor(
		@inject private readonly plot: SharedPlot,
		@inject playerData: PlayerDataStoragee,
		@inject private readonly di: DIContainer,
	) {
		super();

		this.rideModeScene = new RideModeScene(
			Gui.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode,
			playerData,
		);
		this.parentGui(this.rideModeScene);
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
			this.currentMachine = this.di.resolveForeignClass(Machine);
			this.currentMachine.init(this.plot.getBlockDatas());

			SoundController.getSounds().Start.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
