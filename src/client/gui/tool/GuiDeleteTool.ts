import GuiAbstractTool from "./GuiAbstractTool";
import ToolsInterface from "./ToolsInterface";
import DeleteToolAPI from "client/tools/DeleteToolAPI";

export default class GuiDeleteTool extends GuiAbstractTool {
	private toolAPI: DeleteToolAPI;

	constructor(gameUI: GameUI, toolsInterface: ToolsInterface) {
		super(gameUI, toolsInterface);

		this.toolAPI = new DeleteToolAPI(gameUI);
	}

	public getDisplayName(): string {
		return "Deleting Mode";
	}

	public getEquipButton(): Enum.KeyCode {
		// Gamepad controls implementated in GuiAbstractTool
		return Enum.KeyCode.Four;
	}

	public getButton(): Frame & ToolsGuiButton {
		return this.gameUI.Tools.Buttons.Delete;
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.equip();
	}

	public onUnequip(): void {
		super.onUnequip();

		this.toolAPI.unequip();
	}
}
