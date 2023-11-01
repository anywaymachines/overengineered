import BuildToolAPI from "client/tools/BuildToolAPI";
import ToolsGui from "../gui/ToolsGui";
import AbstractToolMeta from "../gui/abstract/AbstractToolMeta";

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
		const keys = new Map<Enum.KeyCode, string>();

		keys.set(Enum.KeyCode.ButtonX, "Place");
		keys.set(Enum.KeyCode.ButtonB, "Unequip");

		return keys;
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}
}
