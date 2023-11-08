import BuildToolAPI from "client/tools/BuildToolAPI";
import HotbarGUI from "../gui/HotbarGUI";
import AbstractToolMeta from "../core/abstract/AbstractToolMeta";
import { UserInputService } from "@rbxts/services";

export default class BuildToolMeta extends AbstractToolMeta {
	constructor(gameUI: GameUI) {
		super(gameUI);

		this.toolAPI = new BuildToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getShortDescription(): string {
		return "Put blocks in the world";
	}

	public getGamepadTooltips(): { image: string; text: string }[] {
		const keys: { image: string; text: string }[] = [];

		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonX), text: "Place" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonB), text: "Unequip" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonSelect), text: "Select block" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadLeft), text: "Rotate by X" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadUp), text: "Rotate by Y" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadRight), text: "Rotate by Z" });

		return keys;
	}

	public getKeyboardTooltips(): { key: string; text: string }[] {
		const keys: { key: string; text: string }[] = [];

		keys.push({ key: "R", text: "Rotate by X" });
		keys.push({ key: "T", text: "Rotate by Y" });
		keys.push({ key: "Y", text: "Rotate by Z" });

		return keys;
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}
}
