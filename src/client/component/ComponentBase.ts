import { ReadonlyInputHandler } from "client/event/InputHandler";
import SharedComponentBase from "shared/component/SharedComponentBase";
import { ClientComponentEvents } from "./ClientComponentEvents";

/** @inheritdoc */
export default class ComponentBase extends SharedComponentBase {
	protected readonly event = new ClientComponentEvents(this);

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: ReadonlyInputHandler;

	constructor() {
		super();
		this.inputHandler = this.event.inputHandler;
	}

	protected onPrepare(callback: (inputType: InputType) => void) {
		this.event.onPrepare(callback);
	}
}
