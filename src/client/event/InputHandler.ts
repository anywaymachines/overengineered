import { UserInputService } from "@rbxts/services";
import EventHandler from "shared/EventHandler";
//import StaticWidgetsController from "client/controller/StaticWidgetsController";

type InputCallback = (input: InputObject) => boolean | unknown;
type TouchCallback = () => boolean | unknown;

/** A class similar to EventHandler, but created to listen to player input, instead of events */
export default class InputHandler {
	private readonly eventHandler: EventHandler = new EventHandler();

	private readonly listenableKeycodes: InputCallback[] = [];
	private readonly touchTapCallbacks: TouchCallback[] = [];

	constructor() {
		this.eventHandler.subscribe(UserInputService.InputBegan, (input: InputObject) => {
			if (!this.isKeyPressed()) return;

			for (const callback of this.listenableKeycodes) {
				if (callback(input) === true) break;
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

		/*if (StaticWidgetsController.isPopupVisible()) {
			return false;
		}*/

		return true;
	}

	public onKeyPressed(keyCode: Enum.KeyCode, callback: InputCallback) {
		return this.onKeysPressed((input) => {
			if (input.KeyCode !== keyCode) return;

			return callback(input);
		});
	}
	public onKeysPressed(callback: InputCallback) {
		return this.listenableKeycodes.push(callback);
	}

	public onTouchTap(callback: TouchCallback) {
		return this.touchTapCallbacks.push(callback);
	}

	public unsubscribeAll() {
		this.listenableKeycodes.clear();
		this.touchTapCallbacks.clear();
	}
}
