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
		return {
			ButtonY: "Clear all",
			ButtonX: "Delete",
			ButtonB: "Unequip",
		};
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Delete;
	}
}
