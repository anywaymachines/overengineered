import BuildToolAPI from "client/tools/BuildToolAPI";
import ToolsGui from "../gui/ToolsGui";
import AbstractToolMeta from "../gui/abstract/AbstractToolMeta";
import { GuiService, UserInputService } from "@rbxts/services";

export default class BuildToolMeta extends AbstractToolMeta {
	constructor(gameUI: GameUI, toolsInterface: ToolsGui) {
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
		const keys = new Map<string, string>();

		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonX), "Place");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonSelect), "Select block");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadLeft), "Rotate by X");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadUp), "Rotate by Y");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadRight), "Rotate by Z");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonB), "Unequip");

		return keys;
	}

	public getKeyboardTooltips(): Map<string, string> {
		const keys = new Map<string, string>();

		keys.set("R", "Rotate by X");
		keys.set("T", "Rotate by Y");
		keys.set("Y", "Rotate by Z");

		return keys;
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}
}
