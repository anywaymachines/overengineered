import BuildToolAPI from "client/tools/BuildToolAPI";
import ToolsGui from "../ToolsGui";
import AbstractToolMeta from "../abstract/AbstractToolMeta";

export default class BuildToolMeta extends AbstractToolMeta {
	constructor(gameUI: MyGui, toolsInterface: ToolsGui) {
		super(gameUI, toolsInterface);

		this.toolAPI = new BuildToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getShortDescription(): string {
		return "Put blocks in the world";
	}

	public getGamepadTooltips() {
		return {
			ButtonX: "Place",
			ButtonB: "Unequip",
		};
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Build;
	}
}
