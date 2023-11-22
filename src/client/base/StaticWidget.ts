import EventHandler from "shared/event/EventHandler";

/** A class for creating popup widgets for use on scenes AoD */
export default abstract class StaticWidget {
	// Handlers
	protected readonly eventHandler: EventHandler;

	constructor() {
		this.eventHandler = new EventHandler();
	}

	/** The function that is called when changing the input type */
	protected inputTypeChanged(): void {
		this.prepare();
	}

	abstract isVisible(): boolean;

	/** A function for preparing functionality for certain platforms */
	protected prepare() {
		// Terminate exist events
		this.eventHandler.unsubscribeAll();
	}

	/** Function for hiding the widget */
	hideWidget(): void {
		// Handlers
		this.eventHandler.unsubscribeAll();
	}
}
