import { UserInputService } from "@rbxts/services";
import EventHandler from "./EventHandler";

export default class InputHandler {
	private eventHandler: EventHandler;

	private listenableKeycodes: { keyCode: Enum.KeyCode; callback: Callback }[] = [];
	private touchTapCallbacks: Callback[] = [];

	constructor(eventHandler: EventHandler) {
		this.eventHandler = eventHandler;

		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject) => {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			this.listenableKeycodes.forEach((event) => {
				if (input.KeyCode === event.keyCode) {
					event.callback();
				}
			});
		});
		this.eventHandler.subscribe(UserInputService.TouchTap, (_) => {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			this.touchTapCallbacks.forEach((callback) => {
				callback();
			});
		});
	}

	public onKeyPressed(keyCode: Enum.KeyCode, callback: Callback) {
		return this.listenableKeycodes.push({ keyCode: keyCode, callback: callback });
	}

	public onTouchTap(callback: Callback) {
		return this.touchTapCallbacks.push(callback);
	}

	public unsubscribeAll() {
		this.listenableKeycodes.clear();
		this.touchTapCallbacks.clear();
	}
}
