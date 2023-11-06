import { Players, UserInputService } from "@rbxts/services";
import Signals from "client/core/network/Signals";
import InputController from "client/core/InputController";
import EventHandler from "client/core/event/EventHandler";

export default abstract class AbstractGUI {
	public gameUI: GameUI;

	public eventHandler: EventHandler = new EventHandler();

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		// Prepare
		this.displayDefaultGUI(true);

		// Events
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input: InputObject, _: boolean) =>
			this.onInput(input),
		);
		this.eventHandler.registerEvent(Signals.PLATFORM_CHANGED, (newPlatform) => this.onPlatformChanged(newPlatform));

		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** Sets the visibility of all GUIs at startup/terminate */
	public abstract displayDefaultGUI(isVisible: boolean): void;

	/** `UserInputService.InputBegan` callback */
	public abstract onInput(input: InputObject): void;

	/** Called when the input device is changed
	 * @param newPlatform device type
	 */
	public abstract onPlatformChanged(newPlatform: typeof InputController.currentPlatform): void;

	/** Sets the visibility of all GUIs at startup. Runs once per player's lifetime. */
	public terminate() {
		this.eventHandler.killAll();
		this.displayDefaultGUI(false);
		script.Destroy();
	}
}
