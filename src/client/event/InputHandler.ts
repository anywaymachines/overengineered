import { UserInputService } from "@rbxts/services";
import EventHandler from "shared/event/EventHandler";

type InputCallback = (input: InputObject, gameProcessedEvent: boolean) => boolean | unknown;
type TouchCallback = () => boolean | unknown;

/** A class similar to EventHandler, but created to listen to player input, instead of events */
export default class InputHandler {
	private readonly eventHandler: EventHandler = new EventHandler();

	private readonly listenableKeycodes: InputCallback[] = [];
	private readonly releaseKeycodes: InputCallback[] = [];
	private readonly touchTapCallbacks: TouchCallback[] = [];

	constructor() {
		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject, gameProcessedEvent: boolean) => {
			if (!this.isKeyPressed()) return;

			for (const callback of this.listenableKeycodes) {
				if (callback(input, gameProcessedEvent) === true) break;
			}
		});
		this.eventHandler.subscribe(UserInputService.InputEnded, (input: InputObject, gameProcessedEvent: boolean) => {
			if (!this.isKeyPressed()) return;

			for (const callback of this.releaseKeycodes) {
				if (callback(input, gameProcessedEvent) === true) break;
			}
		});
		this.eventHandler.subscribe(UserInputService.TouchTap, (_) => {
			if (!this.isKeyPressed()) return;

			this.touchTapCallbacks.forEach((callback) => {
				callback();
			});
		});
	}

	private isKeyPressed(): boolean {
		if (UserInputService.GetFocusedTextBox()) {
			return false;
		}

		return true;
	}

	public onKeyUp(keyCode: Enum.KeyCode, callback: InputCallback) {
		return this.onKeysUp((input, gameProcessedEvent) => {
			if (input.KeyCode !== keyCode) return;

			return callback(input, gameProcessedEvent);
		});
	}
	public onKeysUp(callback: InputCallback) {
		return this.releaseKeycodes.push(callback);
	}

	public onKeyDown(keyCode: Enum.KeyCode | KeyCode, callback: InputCallback) {
		return this.onKeysDown((input, gameProcessedEvent) => {
			if (input.KeyCode !== keyCode && input.KeyCode.Name !== keyCode) {
				return;
			}

			return callback(input, gameProcessedEvent);
		});
	}

	public onKeysDown(callback: InputCallback) {
		return this.listenableKeycodes.push(callback);
	}

	public onMouseButton1Down(callback: InputCallback) {
		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject, gameProcessedEvent: boolean) => {
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				callback(input, gameProcessedEvent);
			}
		});
	}

	public onMouseButton1Up(callback: InputCallback) {
		this.eventHandler.subscribe(UserInputService.InputEnded, (input: InputObject, gameProcessedEvent: boolean) => {
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				callback(input, gameProcessedEvent);
			}
		});
	}

	public onTouchTap(callback: TouchCallback) {
		return this.touchTapCallbacks.push(callback);
	}

	public unsubscribeAll() {
		this.listenableKeycodes.clear();
		this.touchTapCallbacks.clear();
	}
}
