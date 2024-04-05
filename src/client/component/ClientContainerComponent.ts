import { InputController } from "client/controller/InputController";
import { ReadonlyInputHandler } from "client/event/InputHandler";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { ClientComponentEvents } from "./ClientComponentEvents";

/** A component that has children. */
export class ClientContainerComponent<TChild extends IComponent = IComponent> extends ContainerComponent<TChild> {
	readonly event = new ClientComponentEvents(this);

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: ReadonlyInputHandler;

	constructor() {
		super();

		this.inputHandler = this.event.inputHandler;
		this.onEnable(() => this.prepare());
	}

	protected onPrepare(callback: (inputType: InputType) => void) {
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
