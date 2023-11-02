import AliveEventsHandler from "client/event/AliveEventsHandler";
import GuiAnimations from "../GuiAnimations";
import ToolsGui from "../ToolsGui";
import AbstractToolAPI from "./AbstractToolAPI";
import GameControls from "client/GameControls";

export default abstract class AbstractToolMeta {
	// GUIs
	public gameUI: MyGui;
	public toolsInterface: ToolsGui;

	public toolAPI!: AbstractToolAPI;

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
		this.toolAPI.equip();
		this.onPlatformChanged(GameControls.getActualPlatform());

		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.equippedColor, 0.1);
	}

	public onUnequip(): void {
		this.toolAPI.unequip();

		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.unequippedColor, 0.1);
	}

	public onPlatformChanged(platform: string): void {
		if (!this.toolAPI.isEquipped()) {
			return;
		}

		// Call platform change on tool API
		this.toolAPI.onPlatformChanged(platform);
	}

	public abstract getDisplayName(): string;

	public abstract getShortDescription(): string;

	public abstract getKeybind(): Enum.KeyCode;

	public abstract getGamepadTooltips(): Map<Enum.KeyCode, string>;

	public abstract getKeyboardTooltips(): Map<string, string>;

	public abstract getButton(): Frame & MyToolsGuiButton;

	public terminate(): void {
		script.Destroy();
	}
}
