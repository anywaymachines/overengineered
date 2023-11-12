import { UserInputService } from "@rbxts/services";
import EventHandler from "./EventHandler";
import PopupWidgetsController from "client/controller/PopupWidgetsController";

/** A class similar to EventHandler, but created to listen to player input, instead of events */
export default class InputHandler {
	private eventHandler: EventHandler = new EventHandler();

	private listenableKeycodes: { keyCode: Enum.KeyCode; callback: Callback }[] = [];
	private touchTapCallbacks: Callback[] = [];

	constructor() {
		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject) => {
			if (!this.isKeyPressed()) {
				return;
			}

			this.listenableKeycodes.forEach((event) => {
				if (input.KeyCode === event.keyCode) {
					event.callback();
				}
			});
		});
		this.eventHandler.subscribe(UserInputService.TouchTap, (_) => {
			if (!this.isKeyPressed()) {
				return;
			}

			this.touchTapCallbacks.forEach((callback) => {
				callback();
			});
		});
	}

	private isKeyPressed(): boolean {
		if (UserInputService.GetFocusedTextBox()) {
			return false;
		}

		if (PopupWidgetsController.isPopupVisible()) {
			return false;
		}

		return true;
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
