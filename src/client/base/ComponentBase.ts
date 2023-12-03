import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import EventHandler from "shared/event/EventHandler";
import ComponentEventHolder from "./ComponentEventHolder";

/**
 * Base of any component.
 * Handles events and signals which can be enabled or disabled.
 */
export default class ComponentBase {
	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	protected readonly event = new ComponentEventHolder();

	/** Event handler for use in prepare***() */
	protected readonly eventHandler = new EventHandler();

	/** Input handler for use in prepare***() */
	protected readonly inputHandler = new InputHandler();

	constructor() {
		this.event.onPrepare(() => this.prepare());
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	public static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	/** Are component events enabled */
	public isEnabled() {
		return this.event.isEnabled();
	}

	/** Enable component events */
	public enable() {
		this.event.enable();
	}

	/** Disable component events */
	public disable() {
		this.event.disable();
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();
	}

	/** Disable component events and free the memory */
	public destroy() {
		this.disable();
		this.event.destroy();
	}

	/** Prepare the functionality for Desktop */
	protected prepareDesktop() {}
	/** Prepare the functionality for Touch */
	protected prepareTouch() {}
	/** Prepare the functionality for Gamepad */
	protected prepareGamepad() {}

	/** Prepare the functionality (**Unsubscribes from every event and input handler**) */
	protected prepare() {
		// Terminate exist events
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();

		// Call init
		const events = {
			Desktop: () => this.prepareDesktop(),
			Touch: () => this.prepareTouch(),
			Gamepad: () => this.prepareGamepad(),
		};

		events[InputController.inputType]();
	}
}
