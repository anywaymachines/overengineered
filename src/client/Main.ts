import Control from "./base/Control";
import Popup from "./base/Popup";
import PlayerController from "./controller/PlayerController";
import BuildingModeScene, { BuildingModeSceneDefinition } from "./gui/scenes/BuildingModeScene";
import RideModeScene, { RideModeSceneDefinition } from "./gui/scenes/RideModeScene";

export type MainDefinition = Instance & {
	Popup: Folder & {};
	BuildingMode: BuildingModeSceneDefinition;
	RideMode: RideModeSceneDefinition;
};

export type PlayModes = "build" | "ride";

export default class Main extends Control<MainDefinition> {
	private readonly scenes: Readonly<Record<PlayModes, Control>>;
	private activeMode?: PlayModes;

	constructor(gui: MainDefinition) {
		super(gui);

		const buildingMode = new BuildingModeScene(gui.BuildingMode);
		this.add(buildingMode, false);

		const rideMode = new RideModeScene(gui.RideMode);
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
	}

	setMode(mode: PlayModes) {
		if (this.activeMode) {
			this.scenes[this.activeMode].hide();
		}

		this.activeMode = mode;
		this.scenes[mode].show();
	}
}
