import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import SharedComponentEventHolder from "shared/component/SharedComponentEventHolder";

/** @inheritdoc */
export default class ComponentEventHolder extends SharedComponentEventHolder {
	readonly inputHandler = new InputHandler();

	/** Register an event that fires on enable and input type change */
	onPrepare(callback: (inputType: InputType) => void): void {
		this.subscribeObservable(InputController.inputType, callback);
		this.onEnable(() => callback(InputController.inputType.get()));
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
		this.onPrepare(() => this.inputHandler.onInputBegan(callback));
	}
	/** Register an InputEnded event */
	onInputEnd(callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onInputEnded(callback));
	}
	/** Register an InputBegan event, filtered by a keyboard key */
	onKeyDown(key: KeyCode, callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onKeyDown(key, callback));
	}
	/** Register an InputEnded event, filtered by a keyboard key */
	onKeyUp(key: KeyCode, callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onKeyUp(key, callback));
	}

	/** @inheritdoc */
	protected disconnect(): void {
		super.disconnect();
		this.inputHandler.unsubscribeAll();
	}

	/** @inheritdoc */
	destroy(): void {
		super.disable();
		this.inputHandler.destroy();
	}
}
