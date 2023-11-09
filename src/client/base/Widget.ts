import EventHandler from "client/event/EventHandler";
import InputHandler from "client/event/InputHandler";

/** A class for creating widgets for use on scenes */
export default abstract class Widget {
	frame: Frame;

	// Handlers
	eventHandler: EventHandler;
	inputHandler: InputHandler;

	constructor(frame: Frame) {
		this.frame = frame;

		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler(this.eventHandler);
	}

	/** Function for displaying the widget */
	abstract showWidget(hasAnimations: boolean): void;

	/** Function for hiding the widget */
	hideWidget(hasAnimations: boolean): void {
		// Handlers
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();
	}
}
