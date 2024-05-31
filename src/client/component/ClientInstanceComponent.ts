import { ClientComponentEvents } from "client/component/ClientComponentEvents";
import { InputController } from "client/controller/InputController";
import { InstanceComponent } from "shared/component/InstanceComponent";
import type { InputHandler, ReadonlyInputHandler } from "client/event/InputHandler";
import type { EventHandler } from "shared/event/EventHandler";

/** @inheritdoc */
export class ClientInstanceComponent<
	T extends Instance = Instance,
	TChild extends IComponent = IComponent,
> extends InstanceComponent<T, TChild> {
	readonly event = new ClientComponentEvents(this);

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: ReadonlyInputHandler;

	constructor(instance: T) {
		super(instance);

		this.inputHandler = this.event.inputHandler;
		this.onEnable(() => this.prepare());
	}

	protected onPrepare(
		callback: (inputType: InputType, eventHandler: EventHandler, inputHandler: InputHandler) => void,
	) {
		this.event.onPrepare(callback);
	}

	/** Prepare the functionality for Desktop */
	protected prepareDesktop(): void {}
	/** Prepare the functionality for Touch */
	protected prepareTouch(): void {}
	/** Prepare the functionality for Gamepad */
	protected prepareGamepad(): void {}

	/** Prepare the functionality (**Unsubscribes from every event and input handler**) */
	protected prepare(): void {
		const inputType = InputController.inputType.get();
		if (inputType === "Desktop") this.prepareDesktop();
		else if (inputType === "Touch") this.prepareTouch();
		else if (inputType === "Gamepad") this.prepareGamepad();
	}
}
