import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import SharedComponentBase from "shared/component/SharedComponentBase";
import EventHandler from "shared/event/EventHandler";
import ComponentEventHolder from "./ComponentEventHolder";

/**
 * Base of any component.
 * Handles events and signals which can be enabled or disabled.
 */
export default class ComponentBase extends SharedComponentBase {
	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	readonly event: ComponentEventHolder = new ComponentEventHolder();

	/** Event handler for use in prepare***() */
	protected readonly eventHandler: EventHandler = new EventHandler();

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: InputHandler = new InputHandler();

	constructor() {
		super();
		this.event.onPrepare(() => this.prepare());
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	protected onPrepare(callback: (inputType: InputType) => void) {
		this.event.onPrepare(() => callback(InputController.inputType.get()));
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
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();
	}

	/** Disable component events and free the memory */
	destroy(): void {
		this.disable();
		this.event.destroy();
		this.inputHandler.destroy();
	}

	/** Prepare the functionality for Desktop */
	protected prepareDesktop(): void {}
	/** Prepare the functionality for Touch */
	protected prepareTouch(): void {}
	/** Prepare the functionality for Gamepad */
	protected prepareGamepad(): void {}

	/** Prepare the functionality (**Unsubscribes from every event and input handler**) */
	protected prepare(): void {
		// Terminate exist events
		this.inputHandler.unsubscribeAll();

		const inputType = InputController.inputType.get();
		if (inputType === "Desktop") this.prepareDesktop();
		else if (inputType === "Touch") this.prepareTouch();
		else if (inputType === "Gamepad") this.prepareGamepad();
	}
}
