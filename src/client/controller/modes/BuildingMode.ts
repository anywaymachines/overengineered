import BuildingModeScene, { BuildingModeSceneDefinition } from "client/gui/scenes/BuildingModeScene";
import GuiController from "../GuiController";
import ToolController from "../ToolController";
import PlayMode from "./PlayMode";

export default class BuildingMode extends PlayMode {
	constructor() {
		super();

		const tools = new ToolController();
		this.add(tools);

		const scene = new BuildingModeScene(
			GuiController.getGameUI<{ BuildingMode: BuildingModeSceneDefinition }>().BuildingMode,
			tools,
		);
		this.add(scene);
	}

	getName(): PlayModes {
		return "build";
	}

	public onSwitchTo(mode: PlayModes | undefined) {}
	public onSwitchFrom(prev: PlayModes | undefined) {}
}
