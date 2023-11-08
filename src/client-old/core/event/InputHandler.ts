import { UserInputService } from "@rbxts/services";
import EventHandler from "./EventHandler";

export default class InputHandler {
	private eventHandler = new EventHandler();

	private keyCodeEvents: { keyCode: Enum.KeyCode; callback: Callback }[] = [];
	private touchTapEvents: Callback[] = [];

	constructor() {
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input: InputObject) => {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			this.keyCodeEvents.forEach((event) => {
				if (input.KeyCode === event.keyCode) {
					event.callback();
				}
			});
		});
		this.eventHandler.registerEvent(UserInputService.TouchTap, (_) => {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			this.touchTapEvents.forEach((callback) => {
				callback();
			});
		});
	}

	public onKeyPressed(keyCode: Enum.KeyCode, callback: Callback) {
		return this.keyCodeEvents.push({ keyCode: keyCode, callback: callback });
	}

	public onTouchTap(callback: Callback) {
		return this.touchTapEvents.push(callback);
	}

	public killAll() {
		this.keyCodeEvents.clear();
		this.touchTapEvents.clear();
	}
}
