import { Players } from "@rbxts/services";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import EventHandler from "shared/event/EventHandler";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";

/** An abstract class of tools for working with the world */
export default abstract class ToolBase {
	protected readonly gameUI: GameUI;
	protected readonly mouse: Mouse;
	protected isEquipped = false;

	// Handlers
	protected readonly eventHandler: EventHandler;
	protected readonly inputHandler: InputHandler;

	constructor() {
		this.gameUI = GuiController.getGameUI();
		this.mouse = Players.LocalPlayer.GetMouse();

		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler();
	}

	/** The function that is called when changing the input type */
	protected inputTypeChanged(): void {
		this.prepare();
	}

	/** A function for preparing functionality for Desktop */
	protected abstract prepareDesktop(): void;
	/** A function for preparing functionality for Touch */
	protected abstract prepareTouch(): void;
	/** A function for preparing functionality for Gamepad */
	protected abstract prepareGamepad(): void;

	/** A function for preparing functionality for certain platforms */
	protected prepare() {
		// Terminate exist events
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();

		// Required event
		this.eventHandler.subscribeOnce(Signals.INPUT_TYPE_CHANGED_EVENT, () => this.inputTypeChanged());

		// Call init
		const events = {
			Desktop: () => this.prepareDesktop(),
			Touch: () => this.prepareTouch(),
			Gamepad: () => this.prepareGamepad(),
		};

		events[InputController.inputType]();
	}

	/** Called when the tool is activated */
	activate(): void {
		this.isEquipped = true;
		this.prepare();
	}

	/** Called when the tool is de-activated */
	deactivate(): void {
		this.isEquipped = false;
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();
	}

	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	/** Description of the tool, for example: `Splits blocks into atoms` */
	abstract getShortDescription(): string;

	public abstract getGamepadTooltips(): { image: string; text: string }[];
	public abstract getKeyboardTooltips(): { keys: string[]; text: string }[];
}
