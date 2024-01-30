import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import ComponentBase from "./ComponentBase";

export default class ClientComponentData {
	readonly onPrepareDesktop = new Signal<() => void>();
	readonly onPrepareTouch = new Signal<() => void>();
	readonly onPrepareGamepad = new Signal<() => void>();

	private readonly component: ComponentBase;

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: InputHandler = new InputHandler();

	constructor(component: ComponentBase) {
		this.component = component;

		component.event.subscribe(InputController.inputType.changed, () => {
			component.event.disable();
			component.event.enable();
		});

		this.onPrepare((inputType) => {
			if (inputType === "Desktop") this.onPrepareDesktop.Fire();
			else if (inputType === "Touch") this.onPrepareTouch.Fire();
			else if (inputType === "Gamepad") this.onPrepareGamepad.Fire();
		});
	}

	onPrepare(callback: (inputType: InputType) => void) {
		this.component.event.onPrepare(() => callback(InputController.inputType.get()));
	}
}
