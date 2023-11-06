import EventHandler from "client/core/event/EventHandler";
import GuiAnimations from "../../utils/GuiAnimations";
import HotbarGUI from "../../gui/HotbarGUI";
import AbstractToolAPI from "./AbstractToolAPI";

export default abstract class AbstractToolMeta {
	// GUIs
	public gameUI: GameUI;
	public toolsInterface: HotbarGUI;

	public toolAPI!: AbstractToolAPI;

	public eventHandler: EventHandler = new EventHandler();

	private unequippedColor = Color3.fromRGB(47, 47, 47);
	private equippedColor = Color3.fromRGB(85, 85, 85);

	constructor(gameUI: GameUI, toolsInterface: HotbarGUI) {
		this.gameUI = gameUI;
		this.toolsInterface = toolsInterface;

		this.eventHandler.registerEvent(this.getButton().ImageButton.MouseButton1Click, () =>
			toolsInterface.equipTool(this),
		);
	}

	public onEquip(): void {
		this.toolAPI.equip();

		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.equippedColor, 0.1);
	}

	public onUnequip(): void {
		this.toolAPI.unequip();

		// Default tools GUI animation
		GuiAnimations.tweenColor(this.getButton(), this.unequippedColor, 0.1);
	}

	public abstract getDisplayName(): string;

	public abstract getShortDescription(): string;

	public abstract getKeybind(): Enum.KeyCode;

	public abstract getGamepadTooltips(): { image: string; text: string }[];

	public abstract getKeyboardTooltips(): { key: string; text: string }[];

	public abstract getButton(): Frame & MyToolsGuiButton;

	public terminate(): void {
		this.eventHandler.killAll();

		// Unequip if equipped
		if (this.toolAPI.isEquipped()) {
			this.onUnequip();
		}

		script.Destroy();
	}
}
