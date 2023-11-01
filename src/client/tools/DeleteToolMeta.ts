import AbstractToolMeta from "../gui/abstract/AbstractToolMeta";
import ToolsGui from "../gui/ToolsGui";
import DeleteToolAPI from "client/tools/DeleteToolAPI";

export default class DeleteToolGui extends AbstractToolMeta {
	constructor(gameUI: MyGui, toolsInterface: ToolsGui) {
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
		const keys = new Map<Enum.KeyCode, string>();

		keys.set(Enum.KeyCode.ButtonY, "Clear all");
		keys.set(Enum.KeyCode.ButtonX, "Delete");
		keys.set(Enum.KeyCode.ButtonB, "Unequip");

		return keys;
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Buttons.Delete;
	}
}
