import EventHandler from "shared/event/EventHandler";
import SharedComponentEventHolder from "./SharedComponentEventHolder";

/**
 * Base of any component.
 * Handles events and signals which can be enabled or disabled.
 */
export default class SharedComponentBase {
	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	readonly event: SharedComponentEventHolder = new SharedComponentEventHolder();

	/** Event handler for use in prepare***() */
	protected readonly eventHandler: EventHandler = new EventHandler();

	constructor() {
		this.event.onEnable(() => this.eventHandler.unsubscribeAll());
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	/** Are component events enabled */
	isEnabled(): boolean {
		return this.event.isEnabled();
	}

	/** Enable component events */
	enable(): void {
		this.event.enable();
	}

	/** Disable component events */
	disable(): void {
		this.event.disable();
		this.eventHandler.unsubscribeAll();
	}

	/** Disable component events and free the memory */
	destroy(): void {
		this.disable();
		this.event.destroy();
	}

	/** Prepare the functionality (**Unsubscribes from every event and input handler**) */
	protected prepare(): void {
		// Terminate exist events
		this.eventHandler.unsubscribeAll();
	}
}
