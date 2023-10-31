import AbstractToolGui from "../abstract/AbstractToolGui";
import ToolsGui from "../ToolsGui";
import DeleteToolAPI from "client/tools/DeleteToolAPI";

export default class DeleteToolGui extends AbstractToolGui {
	private toolAPI: DeleteToolAPI;

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
			ButtonX: "Delete",
			ButtonB: "Unequip",
		};
	}

	public onPlatformChanged(): void {
		if (!this.toolAPI.isEquipped()) {
			return;
		}

		// Call platform change on tool API
		this.toolAPI.onPlatformChanged();
	}

	public getKeybind(): Enum.KeyCode {
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Delete;
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.equip();
		this.onPlatformChanged();
	}

	public onUnequip(): void {
		super.onUnequip();

		this.toolAPI.unequip();
	}
}
