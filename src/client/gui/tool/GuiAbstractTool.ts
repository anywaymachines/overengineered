import GuiAnimations from "../GuiAnimations";
import ToolsInterface from "./ToolsInterface";

export default abstract class GuiAbstractTool {
	// GUIs
	public gameUI: GameUI;
	public toolsInterface: ToolsInterface;

	// Events
	private buttonEvent: RBXScriptConnection;

	constructor(gameUI: GameUI, toolsInterface: ToolsInterface) {
		this.gameUI = gameUI;
		this.toolsInterface = toolsInterface;

		this.buttonEvent = this.getButton().ImageButton.MouseButton1Click.Connect(() => toolsInterface.equipTool(this));
	}

	public onEquip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenTransparency(this.getButton(), 0, 0.2);
	}

	public onUnequip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenTransparency(this.getButton(), 1, 0.2);
	}

	public abstract onControlChanged(): void;

	public abstract getDisplayName(): string;

	public abstract getShortDescription(): string;

	public abstract getEquipButton(): Enum.KeyCode;

	public abstract getButton(): Frame & ToolsGuiButton;

	public terminate(): void {
		this.buttonEvent.Disconnect();
		script.Destroy();
	}
}
