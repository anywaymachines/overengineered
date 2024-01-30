import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import SharedComponent from "shared/component/SharedComponent";
import SharedComponentBase from "shared/component/SharedComponentBase";
import SharedComponentContainer from "shared/component/SharedComponentContainer";

class ClientComponentAdditions {
	readonly inputHandler: InputHandler = undefined!;

	protected onPrepare(callback: (inputType: InputType) => void, executeImmediately = false): void {}

	protected prepareDesktop(): void {}
	protected prepareTouch(): void {}
	protected prepareGamepad(): void {}
}

type AsClientComponent<T extends { new (...args: unknown[]): SharedComponentBase }> = T & {
	new (
		...args: T extends { new (...args: infer TArgs): unknown } ? TArgs : never
	): ClientComponentAdditions & (T extends { new (...args: never[]): infer TRet } ? TRet : never);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const amongus = <T extends { new (...args: any[]): SharedComponentBase }>(superClass: T): AsClientComponent<T> => {
	return class extends superClass {
		/** Input handler for use in prepare***() */
		protected readonly inputHandler: InputHandler = new InputHandler();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		constructor(...args: any[]) {
			super(...(args as unknown[]));

			this.event.subscribe(InputController.inputType.changed, () => {
				this.event.disable();
				this.event.enable();
			});
		}

		protected onPrepare(callback: (inputType: InputType) => void, executeImmediately = false) {
			this.event.onEnable(() => callback(InputController.inputType.get()), executeImmediately);
		}

		/** Prepare the functionality for Desktop */
		protected prepareDesktop(): void {}
		/** Prepare the functionality for Touch */
		protected prepareTouch(): void {}
		/** Prepare the functionality for Gamepad */
		protected prepareGamepad(): void {}

		protected prepare(): void {
			super.prepare();
			this.inputHandler.unsubscribeAll();

			const inputType = InputController.inputType.get();
			if (inputType === "Desktop") this.prepareDesktop();
			else if (inputType === "Touch") this.prepareTouch();
			else if (inputType === "Gamepad") this.prepareGamepad();
		}
	} as never;
};

export const ComponentBase = amongus(SharedComponentBase);
export const ComponentContainer = amongus(SharedComponentContainer);
export const Component = amongus(SharedComponent);
export type ComponentBase = typeof ComponentBase;
export type ComponentContainer = typeof ComponentContainer;
export type Component = typeof Component;

class Control<T extends Instance = Instance, TChild extends SharedComponent = SharedComponent> extends amongus(
	SharedComponent,
)<T, TChild> {
	constructor(instance: T) {
		super(instance);
		super.add(undefined!);
	}

	/*
	protected prepareDesktop(): void {
		super.prepareDesktop();
	}
	*/
}
