import { Machine } from "client/blocks/Machine";
import { SoundController } from "client/controller/SoundController";
import { Gui } from "client/gui/Gui";
import { RideModeScene } from "client/gui/ridemode/RideModeScene";
import { PlayMode } from "client/modes/PlayMode";
import type { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class RideMode extends PlayMode {
	private currentMachine?: Machine;
	private readonly rideModeScene;

	constructor(
		@inject private readonly blockRegistry: BlockRegistry,
		@inject private readonly plot: SharedPlot,
	) {
		super();

		this.rideModeScene = new RideModeScene(Gui.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode);
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
			this.currentMachine = new Machine(this.blockRegistry);
			this.currentMachine.init(this.plot.getBlockDatas());

			SoundController.getSounds().Start.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
