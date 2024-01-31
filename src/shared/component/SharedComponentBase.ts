import EventHandler from "shared/event/EventHandler";
import SharedComponentEventHolder from "./SharedComponentEventHolder";

/**
 * Base of any component.
 * Handles events and signals which can be enabled or disabled.
 */
export default class SharedComponentBase<TEventHolder extends SharedComponentEventHolder = SharedComponentEventHolder> {
	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	readonly event: TEventHolder;

	/** Event handler for use in prepare***() */
	protected readonly eventHandler: EventHandler;

	constructor() {
		this.event = this.createEventHolder();
		this.eventHandler = this.event.eventHandler;
	}

	protected createEventHolder(): TEventHolder {
		return new SharedComponentEventHolder() as TEventHolder;
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
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
}
