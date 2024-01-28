import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import EventHandler from "shared/event/EventHandler";
import ComponentEventHolder from "./ComponentEventHolder";

/**
 * Base of any component.
 * Handles events and signals which can be enabled or disabled.
 */
export default class ComponentBase {
	readonly onEnabled = new Signal<() => void>();
	readonly onDisabled = new Signal<() => void>();

	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	readonly event: ComponentEventHolder = new ComponentEventHolder();

	/** Event handler for use in prepare***() */
	protected readonly eventHandler: EventHandler = new EventHandler();

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: InputHandler = new InputHandler();

	constructor() {
		this.event.onPrepare(() => this.prepare());
		this.event.subscribe(InputController.inputType.changed, () => {
			this.event.disable();
			this.event.enable();
		});
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	protected onPrepare(callback: (inputType: InputType) => void, executeImmediately = false) {
		this.event.onPrepare(() => callback(InputController.inputType.get()), executeImmediately);
	}

	/** Are component events enabled */
	isEnabled(): boolean {
		return this.event.isEnabled();
	}

	/** Enable component events */
	enable(): void {
		this.onEnabled.Fire();
		this.event.enable();
	}

	/** Disable component events */
	disable(): void {
		this.onDisabled.Fire();
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
		this.eventHandler.unsubscribeAll();

		const inputType = InputController.inputType.get();
		if (inputType === "Desktop") this.prepareDesktop();
		else if (inputType === "Touch") this.prepareTouch();
		else if (inputType === "Gamepad") this.prepareGamepad();
	}
}
