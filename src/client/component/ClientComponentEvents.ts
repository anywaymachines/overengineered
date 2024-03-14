import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import { ComponentEvents } from "shared/component/ComponentEvents";
import EventHandler from "shared/event/EventHandler";

export class ClientComponentEvents extends ComponentEvents {
	readonly inputHandler = new InputHandler();

	constructor(state: IComponent) {
		super(state);

		state.onDisable(() => this.inputHandler.unsubscribeAll());
		state.onDestroy(() => this.inputHandler.destroy());

		this.subscribeObservable2(InputController.inputType, () => {
			state.disable();
			state.enable();
		});
	}

	/** Register an event that fires on enable and input type change */
	onPrepare(callback: (inputType: InputType, eventHandler: EventHandler) => void): void {
		this.onEnable(() => callback(InputController.inputType.get(), this.eventHandler));
	}

	/** Register an event that fires on enable and input type change to Desktop */
	onPrepareDesktop(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Desktop") return;
			callback();
		});
	}
	/** Register an event that fires on enable and input type change to Touch */
	onPrepareTouch(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Touch") return;
			callback();
		});
	}
	/** Register an event that fires on enable and input type change to Gamepad */
	onPrepareGamepad(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Gamepad") return;
			callback();
		});
	}

	/** Register an InputBegan event */
	onInputBegin(callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onInputBegan(callback));
	}
	/** Register an InputEnded event */
	onInputEnd(callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onInputEnded(callback));
	}
	/** Register an InputBegan event, filtered by a keyboard key */
	onKeyDown(key: KeyCode, callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onKeyDown(key, callback));
	}
	/** Register an InputEnded event, filtered by a keyboard key */
	onKeyUp(key: KeyCode, callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onKeyUp(key, callback));
	}
	subInput(setup: (inputHandler: InputHandler) => void) {
		this.onEnable(() => setup(this.inputHandler));
	}
}
