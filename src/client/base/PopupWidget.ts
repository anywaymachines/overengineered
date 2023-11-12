import EventHandler from "client/event/EventHandler";

/** A class for creating popup widgets for use on scenes AoD */
export default abstract class PopupWidget {
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

	/** Function for displaying the widget */
	display(heading: string, text: string, callback: Callback): void {
		this.prepare();
	}

	/** Function for hiding the widget */
	hideWidget(): void {
		// Handlers
		this.eventHandler.unsubscribeAll();
	}
}
