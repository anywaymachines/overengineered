import InputHandler from "client/event/InputHandler";
import EventHandler from "shared/event/EventHandler";

export default abstract class BlockLogic {
	protected block: Model;

	protected eventHandler: EventHandler;
	protected inputHandler: InputHandler;

	constructor(block: Model) {
		this.block = block;

		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler();
	}

	protected setup(): void {
		this.eventHandler.subscribeOnce(this.block.Destroying, () => this.kill());
	}

	protected kill(): void {
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();
	}
}
