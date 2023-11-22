import InputController from "client/controller/InputController";
import EventHandler from "shared/event/EventHandler";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";

/** A class for creating widgets for use on scenes */
export default abstract class Widget {
	// Handlers
	protected readonly eventHandler: EventHandler;
	protected readonly inputHandler: InputHandler;

	constructor() {
		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler();
	}

	/** The function that is called when changing the input type */
	protected inputTypeChanged(): void {
		this.prepare();
	}

	abstract isVisible(): boolean;

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

	/** Function for displaying the widget */
	showWidget(hasAnimations: boolean): void {
		this.prepare();
	}

	/** Function for hiding the widget */
	hideWidget(hasAnimations: boolean): void {
		// Handlers
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();
	}
}
