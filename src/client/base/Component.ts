import InputController from "client/controller/InputController";
import { ReadonlyInputHandler } from "client/event/InputHandler";
import SharedComponent from "shared/component/SharedComponent";
import SharedComponentBase from "shared/component/SharedComponentBase";
import ComponentEventHolder from "./ComponentEventHolder";

/** A component that controls an Instance and has children. */
export default class Component<
	T extends Instance = Instance,
	TChild extends SharedComponentBase = SharedComponentBase,
> extends SharedComponent<T, TChild, ComponentEventHolder> {
	/** Input handler for use in prepare***() */
	protected readonly inputHandler: ReadonlyInputHandler;

	constructor(instance: T) {
		super(instance);

		this.inputHandler = this.event.inputHandler;
		this.event.onPrepare(() => this.prepare());
	}

	protected createEventHolder(): ComponentEventHolder {
		return new ComponentEventHolder();
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
