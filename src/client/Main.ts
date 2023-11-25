import Control from "./base/Control";
import Popup from "./base/Popup";
import GuiController from "./controller/GuiController";
import PlayerController from "./controller/PlayerController";
import Signals, { PlayModes } from "./event/Signals";
import BuildingModeScene, { BuildingModeSceneDefinition } from "./gui/scenes/BuildingModeScene";
import RideModeScene, { RideModeSceneDefinition } from "./gui/scenes/RideModeScene";

export type MainDefinition = Instance & {
	Popup: Folder & {};
	BuildingMode: BuildingModeSceneDefinition;
	RideMode: RideModeSceneDefinition;
};

export default class Main extends Control<MainDefinition> {
	public static readonly instance = new Main(GuiController.getGameUI<MainDefinition>());

	private readonly scenes: Readonly<Record<PlayModes, Control>>;
	private activeMode?: PlayModes;

	constructor(gui: MainDefinition) {
		super(gui);

		const buildingMode = new BuildingModeScene(gui.BuildingMode);
		this.add(buildingMode, false);

		const rideMode = new RideModeScene(gui.RideMode);
		rideMode.hide();
		this.add(buildingMode, false);

		this.scenes = {
			build: buildingMode,
			ride: rideMode!,
		};

		const controls = PlayerController.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();

			if (this.activeMode) {
				this.scenes[this.activeMode].hide();
			}
		});
		this.event.subscribe(Popup.onAnyHide, () => {
			controls.Enable();

			if (this.activeMode) {
				this.scenes[this.activeMode].show();
			}
		});

		this.event.subscribeObservable(
			Signals.PLAY_MODE,
			(mode) => {
				if (this.activeMode) {
					this.scenes[this.activeMode].hide();
				}

				this.activeMode = mode;
				this.scenes[mode].show();
			},
			true,
		);
	}
}
