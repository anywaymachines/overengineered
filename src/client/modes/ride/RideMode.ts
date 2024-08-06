import { ClientMachine } from "client/blocks/ClientMachine";
import { Machine } from "client/blocks/Machine";
import { SoundController } from "client/controller/SoundController";
import { Gui } from "client/gui/Gui";
import { RideModeScene } from "client/gui/ridemode/RideModeScene";
import { PlayMode } from "client/modes/PlayMode";
import { CustomRemotes } from "shared/Remotes";
import { Switches } from "shared/Switches";
import type { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { PlacedBlockData2 } from "shared/blockLogic/BlockLogic";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class RideMode extends PlayMode {
	private currentMachine?: Machine | ClientMachine;
	private readonly rideModeScene;

	constructor(
		@inject private readonly plot: SharedPlot,
		@inject playerData: PlayerDataStorage,
		@inject private readonly di: DIContainer,
	) {
		super();

		this.rideModeScene = new RideModeScene(
			Gui.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode,
			playerData,
		);
		this.parentGui(this.rideModeScene);

		CustomRemotes.modes.set.sent.Connect((mode) => {
			if (mode === "ride") return;
			if (!this.currentMachine) return;

			this.currentMachine.getImpactController()?.disable();
		});

		CustomRemotes.physics.normalizeRootparts.invoked.Connect((data) => {
			for (const part of data.parts) {
				const attachment = new Instance("Attachment", part);

				const alignPosition = new Instance("AlignPosition");
				alignPosition.Mode = Enum.PositionAlignmentMode.OneAttachment;
				alignPosition.Attachment0 = attachment;
				alignPosition.MaxForce = math.huge;
				alignPosition.MaxVelocity = math.huge;
				alignPosition.Responsiveness = 200;

				const alignOrientation = new Instance("AlignOrientation");
				alignOrientation.Mode = Enum.OrientationAlignmentMode.OneAttachment;
				alignOrientation.Attachment0 = attachment;
				alignOrientation.MaxAngularVelocity = math.huge;
				alignOrientation.MaxTorque = math.huge;
				alignOrientation.Responsiveness = 200;

				alignPosition.Parent = part;
				alignOrientation.Parent = part;
			}
		});
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
			if (Switches.isNewBlockLogic.get()) {
				this.currentMachine = this.di.resolveForeignClass(ClientMachine);
				this.currentMachine.init(this.plot.getBlockDatas() as PlacedBlockData2[]);
			} else {
				this.currentMachine = this.di.resolveForeignClass(Machine);
				this.currentMachine.init(this.plot.getBlockDatas());
			}

			SoundController.getSounds().Start.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
