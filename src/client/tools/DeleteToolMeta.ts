import { UserInputService } from "@rbxts/services";
import AbstractToolMeta from "../gui/abstract/AbstractToolMeta";
import ToolsGui from "../gui/ToolsGui";
import DeleteToolAPI from "client/tools/DeleteToolAPI";

export default class DeleteToolGui extends AbstractToolMeta {
	constructor(gameUI: GameUI, toolsInterface: ToolsGui) {
		super(gameUI, toolsInterface);

		this.toolAPI = new DeleteToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Deleting Mode";
	}

	public getShortDescription(): string {
		return "Removes unnecessary blocks";
	}

	public getGamepadTooltips() {
		const keys = new Map<string, string>();

		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonY), "Clear all");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonX), "Delete");
		keys.set(UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonB), "Unequip");

		return keys;
	}

	public getKeyboardTooltips(): Map<string, string> {
		const keys = new Map<string, string>();

		return keys;
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Delete;
	}
}
