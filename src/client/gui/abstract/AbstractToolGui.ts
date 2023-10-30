import AliveEventsHandler from "client/event/AliveEventsHandler";
import GuiAnimations from "../GuiAnimations";
import ToolsGui from "../ToolsGui";

export default abstract class GuiAbstractTool {
	// GUIs
	public gameUI: MyGui;
	public toolsInterface: ToolsGui;

	private unequippedColor = Color3.fromRGB(47, 47, 47);
	private equippedColor = Color3.fromRGB(85, 85, 85);

	constructor(gameUI: MyGui, toolsInterface: ToolsGui) {
		this.gameUI = gameUI;
		this.toolsInterface = toolsInterface;

		AliveEventsHandler.registerAliveEvent(this.getButton().ImageButton.MouseButton1Click, () =>
			toolsInterface.equipTool(this),
		);
	}

	public onEquip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.equippedColor, 0.1);
	}

	public onUnequip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.unequippedColor, 0.1);
	}

	public abstract onPlatformChanged(): void;

	public abstract getDisplayName(): string;

	public abstract getShortDescription(): string;

	public abstract getKeybind(): Enum.KeyCode;

	public abstract getGamepadTooltips(): GamepadTextTooltip;

	public abstract getButton(): Frame & MyToolsGuiButton;

	public terminate(): void {
		script.Destroy();
	}
}
