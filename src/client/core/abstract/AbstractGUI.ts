import { Players } from "@rbxts/services";
import Signals from "client/core/network/Signals";
import InputController from "client/core/InputController";
import EventHandler from "client/core/event/EventHandler";
import InputHandler from "../event/InputHandler";

export default abstract class AbstractGUI {
	public gameUI: GameUI;

	public eventHandler: EventHandler = new EventHandler();
	public inputHandler: InputHandler = new InputHandler();

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		// Prepare
		this.displayDefaultGUI(true);

		// Events
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** Sets the visibility of all GUIs at startup/terminate */
	public abstract displayDefaultGUI(isVisible: boolean): void;

	public prepareEvents(platform: typeof InputController.currentPlatform): void {
		this.eventHandler.killAll();
		this.inputHandler.killAll();

		this.eventHandler.registerEvent(Signals.PLATFORM_CHANGED, (newPlatform) => this.onPlatformChanged(newPlatform));

		const platformEvents = {
			Desktop: () => this.registerDesktopEvents(),
			Console: () => this.registerConsoleEvents(),
			Touch: () => this.registerTouchEvents(),
		};

		// Invoke the function associated with the current platform
		platformEvents[platform]();
		this.registerSharedEvents();
	}

	public registerSharedEvents(): void {}
	public registerDesktopEvents(): void {}
	public registerConsoleEvents(): void {}
	public registerTouchEvents(): void {}

	/** Called when the input device is changed
	 * @param newPlatform device type
	 */
	public onPlatformChanged(platform: typeof InputController.currentPlatform): void {
		this.prepareEvents(platform);
	}

	/** Sets the visibility of all GUIs at startup. Runs once per player's lifetime. */
	public terminate() {
		this.eventHandler.killAll();
		this.inputHandler.killAll();

		this.displayDefaultGUI(false);
		script.Destroy();
	}
}
