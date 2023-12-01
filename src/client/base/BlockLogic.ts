import { HttpService } from "@rbxts/services";
import InputHandler from "client/event/InputHandler";
import EventHandler from "shared/event/EventHandler";

export default abstract class BlockLogic {
	protected block: Model;

	protected config: Record<string, unknown> | undefined;

	protected eventHandler: EventHandler;
	protected inputHandler: InputHandler;

	constructor(block: Model) {
		this.block = block;

		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler();

		const configAttribute = block.GetAttribute("config") as string | undefined;
		this.config =
			configAttribute !== undefined
				? (HttpService.JSONDecode(configAttribute) as Record<string, unknown>)
				: undefined;
	}

	protected setup(): void {
		this.eventHandler.subscribeOnce(this.block.Destroying, () => this.kill());
	}

	protected kill(): void {
		this.eventHandler.unsubscribeAll();
	}
}
