import AliveEventsHandler from "client/AliveEventsHandler";
import GuiAnimations from "../GuiAnimations";
import ToolsGui from "./ToolsGui";
import { UserInputService } from "@rbxts/services";

export default abstract class GuiAbstractTool {
	// GUIs
	public gameUI: GameUI;
	public toolsInterface: ToolsGui;

	constructor(gameUI: GameUI, toolsInterface: ToolsGui) {
		this.gameUI = gameUI;
		this.toolsInterface = toolsInterface;

		AliveEventsHandler.registerAliveEvent(this.getButton().ImageButton.MouseButton1Click, () =>
			toolsInterface.equipTool(this),
		);
		AliveEventsHandler.registerAliveEvent(UserInputService.InputBegan, (input: InputObject) => this.onInput(input));
	}

	public onEquip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenTransparency(this.getButton(), 0, 0.2);
	}

	public onUnequip(): void {
		// Default tools GUI animation
		GuiAnimations.tweenTransparency(this.getButton(), 1, 0.2);
	}

	public abstract onInput(input: InputObject): void;

	public abstract onPlatformChanged(): void;

	public abstract getDisplayName(): string;

	public abstract getShortDescription(): string;

	public abstract getEquipButton(): Enum.KeyCode;

	public abstract getButton(): Frame & ToolsGuiButton;

	public terminate(): void {
		script.Destroy();
	}
}
