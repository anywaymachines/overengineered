import { UserInputService } from "@rbxts/services";
import EventHandler from "./EventHandler";

/** A class similar to EventHandler, but created to listen to player input, instead of events */
export default class InputHandler {
	private eventHandler: EventHandler = new EventHandler();

	private listenableKeycodes: { keyCode: Enum.KeyCode; callback: Callback }[] = [];
	private touchTapCallbacks: Callback[] = [];

	constructor() {
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
