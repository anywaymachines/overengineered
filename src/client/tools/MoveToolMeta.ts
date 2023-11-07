import { UserInputService } from "@rbxts/services";
import AbstractToolMeta from "../core/abstract/AbstractToolMeta";
import MoveToolAPI from "./MoveToolAPI";

export default class MoveToolMeta extends AbstractToolMeta {
	constructor(gameUI: GameUI) {
		super(gameUI);

		this.toolAPI = new MoveToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Moving Mode";
	}

	public getShortDescription(): string {
		return "Moves the building";
	}

	public getGamepadTooltips(): { image: string; text: string }[] {
		const keys: { image: string; text: string }[] = [];

		// TODO
		// keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadLeft), text: "Move by X" });
		// keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadUp), text: "Move by +Y" });
		// keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadDown), text: "Move by -Y" });
		// keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.DPadRight), text: "Move by Z" });
		// keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonY), text: "Hold to inverse" });

		return keys;
	}

	public getKeyboardTooltips(): { key: string; text: string }[] {
		return [];
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Two;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Move;
	}
}
