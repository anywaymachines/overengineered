import { UserInputService } from "@rbxts/services";
import AbstractToolMeta from "../core/abstract/AbstractToolMeta";
import DeleteToolAPI from "client/tools/DeleteToolAPI";

export default class DeleteToolGui extends AbstractToolMeta {
	constructor(gameUI: GameUI) {
		super(gameUI);

		this.toolAPI = new DeleteToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Deleting Mode";
	}

	public getShortDescription(): string {
		return "Removes unnecessary blocks";
	}

	public getGamepadTooltips(): { image: string; text: string }[] {
		const keys: { image: string; text: string }[] = [];

		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonY), text: "Clear all" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonX), text: "Delete" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonB), text: "Unequip" });

		return keys;
	}

	public getKeyboardTooltips(): { key: string; text: string }[] {
		return [];
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Delete;
	}
}
