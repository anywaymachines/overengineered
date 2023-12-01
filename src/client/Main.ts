import Control from "./base/Control";
import Popup from "./base/Popup";
import GuiController from "./controller/GuiController";
import PlayerController from "./controller/PlayerController";
import Signals from "./event/Signals";
import BuildingModeScene, { BuildingModeSceneDefinition } from "./gui/scenes/BuildingModeScene";
import RideModeScene, { RideModeSceneDefinition } from "./gui/ridemode/RideModeScene";
import PlayModeController from "./controller/PlayModeController";

export type MainDefinition = Instance & {
	Popup: Folder & {};
	BuildingMode: BuildingModeSceneDefinition;
	RideMode: RideModeSceneDefinition;
};

/** Control that controls playmode scenes */
export default class Main extends Control<MainDefinition> {
	public static readonly instance = new Main(GuiController.getGameUI<MainDefinition>());

	private readonly scenes: Readonly<Record<PlayModes, Control>>;

	constructor(gui: MainDefinition) {
		super(gui);

		const buildingMode = new BuildingModeScene(gui.BuildingMode);
		this.add(buildingMode, false);

		const rideMode = new RideModeScene(gui.RideMode);
		rideMode.hide();
		this.add(buildingMode, false);

		this.scenes = {
			build: buildingMode,
			ride: rideMode,
		};

		const controls = PlayerController.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();

			const active = PlayModeController.instance.playmode.get();
			if (active) this.scenes[active].hide();
		});
		this.event.subscribe(Popup.onAnyHide, () => {
			controls.Enable();

			const active = PlayModeController.instance.playmode.get();
			if (active) this.scenes[active].show();
		});

		this.event.subscribeObservable(
			PlayModeController.instance.playmode,
			(mode, prev) => this.setMode(mode, prev),
			true,
		);
		this.event.subscribe(Signals.PLAYER.DIED, () =>
			this.setMode(undefined, PlayModeController.instance.playmode.get()),
		);
	}

	private async setMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (prev) this.scenes[prev].hide();
		if (mode) this.scenes[mode].show();
	}
}
