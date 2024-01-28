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
	private readonly events: InputCallback[] = [];
	private registered = false;

	private isKeyPressed(): boolean {
		if (UserInputService.GetFocusedTextBox()) {
			return false;
		}

		return true;
	}

	private registerCallbacksIfNeeded() {
		if (this.registered) return;
		this.registered = true;

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

		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject, gameProcessedEvent: boolean) => {
			this.events.forEach((callback) => callback(input, gameProcessedEvent));
		});
		this.eventHandler.subscribe(UserInputService.InputEnded, (input: InputObject, gameProcessedEvent: boolean) => {
			this.events.forEach((callback) => callback(input, gameProcessedEvent));
		});
	}

	public onKeyUp(keyCode: Enum.KeyCode, callback: InputCallback) {
		return this.onKeysUp((input, gameProcessedEvent) => {
			if (input.KeyCode !== keyCode) return;

			return callback(input, gameProcessedEvent);
		});
	}
	public onKeysUp(callback: InputCallback) {
		this.registerCallbacksIfNeeded();
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
		this.registerCallbacksIfNeeded();
		return this.listenableKeycodes.push(callback);
	}

	public onMouseButton1Down(callback: InputCallback) {
		this.registerCallbacksIfNeeded();

		return this.events.push((input, gameProcessedEvent) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) return;
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
			callback(input, gameProcessedEvent);
		});
	}

	public onMouseButton1Up(callback: InputCallback) {
		this.registerCallbacksIfNeeded();

		return this.events.push((input, gameProcessedEvent) => {
			if (input.UserInputState !== Enum.UserInputState.End) return;
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
			callback(input, gameProcessedEvent);
		});
	}

	public onTouchTap(callback: TouchCallback) {
		this.registerCallbacksIfNeeded();
		return this.touchTapCallbacks.push(callback);
	}

	public unsubscribeAll() {
		this.listenableKeycodes.clear();
		this.touchTapCallbacks.clear();
		this.eventHandler.unsubscribeAll();
		this.events.clear();

		this.registered = false;
	}
}
