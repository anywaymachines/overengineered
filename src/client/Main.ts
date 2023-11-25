import Control from "./base/Control";
import BuildingModeScene, { BuildingModeSceneDefinition } from "./gui/scenes/BuildingModeScene";
import Popup from "./base/Popup";
import Scene from "./base/Scene";
import PlayerController from "./controller/PlayerController";

export type MainDefinition = Instance & {
	BuildingMode: BuildingModeSceneDefinition;
	Popup: Folder & {};
};

export type PlayModes = "build" | "play";

export default class Main extends Control<MainDefinition> {
	private readonly scenes: Readonly<Record<PlayModes, Scene>>;
	private activeMode?: PlayModes;

	constructor(gui: MainDefinition) {
		super(gui);

		const buildingMode = new BuildingModeScene(gui.BuildingMode);
		this.add(buildingMode, false);

		this.scenes = {
			build: buildingMode,
			play: undefined!,
		};

		const controls = PlayerController.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();
			print("onAnyShow");

			if (this.activeMode) {
				print("onAnyShow " + this.scenes[this.activeMode].isVisible());
				this.scenes[this.activeMode].hide();
				print("onAnyShow " + this.scenes[this.activeMode].isVisible());
				print("onAnyShow " + this.scenes[this.activeMode].getGui().IsA("GuiObject"));
			}
		});
		this.event.subscribe(Popup.onAnyHide, () => {
			controls.Enable();
			print("onAnyHide");

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
