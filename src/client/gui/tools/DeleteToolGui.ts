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
		return {};
	}

	public onPlatformChanged(): void {}

	public getKeybind(): Enum.KeyCode {
		// Gamepad controls implementated in GuiAbstractTool
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & MyToolsGuiButton {
		return this.gameUI.Tools.Delete;
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.equip();
	}

	public onUnequip(): void {
		super.onUnequip();

		this.toolAPI.unequip();
	}

	public onInput(input: InputObject): void {}
}
