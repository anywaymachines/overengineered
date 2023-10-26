import ClientBuilding from "client/tools/ClientBuilding";
import GuiAbstractTool from "./GuiAbstractTool";
import ToolsInterface from "./ToolsInterface";

export default class GuiBuildTool extends GuiAbstractTool {
	private toolAPI: ClientBuilding;

	constructor(gameUI: GameUI, toolsInterface: ToolsInterface) {
		super(gameUI, toolsInterface);

		this.toolAPI = new ClientBuilding(gameUI);
	}

	public getDisplayName(): string {
		return "Building Mode";
	}

	public getEquipButton(): Enum.KeyCode {
		// Gamepad implementated in GuiAbstractTool
		return Enum.KeyCode.One;
	}

	public getButton(): Frame & ToolsGuiButton {
		return this.gameUI.Tools.Buttons.Build;
	}

	public onEquip(): void {
		super.onEquip();

		this.toolAPI.startBuilding();
	}

	public onUnequip(): void {
		super.onUnequip();

		this.toolAPI.stopBuilding();
	}
}
