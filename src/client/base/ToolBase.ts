import { Players } from "@rbxts/services";
import GuiController from "client/controller/GuiController";
import ComponentBase from "./ComponentBase";

/** An abstract class of tools for working with the world */
export default abstract class ToolBase extends ComponentBase {
	protected readonly gameUI;
	protected readonly mouse: Mouse;
	protected isEquipped = false;

	constructor() {
		super();

		this.gameUI = GuiController.getGameUI<ScreenGui>();
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	public enable() {
		this.isEquipped = true;
		super.enable();
	}

	public disable() {
		this.isEquipped = false;
		super.disable();
	}

	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	/** Description of the tool, for example: `Splits blocks into atoms` */
	abstract getShortDescription(): string;

	public abstract getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[];
	public abstract getKeyboardTooltips(): readonly { keys: string[]; text: string }[];
}
