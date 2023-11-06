import { Players, UserInputService } from "@rbxts/services";
import Signals from "client/core/network/Signals";
import InputController from "client/core/InputController";
import EventHandler from "client/core/event/EventHandler";
import InputHandler from "../event/InputHandler";

/** A class for implementing the API for tools */
export default abstract class AbstractToolAPI {
	public gameUI: GameUI;
	public mouse: Mouse;
	public eventHandler: EventHandler;
	public inputHandler: InputHandler;
	private equipped = false;

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		this.mouse = Players.LocalPlayer.GetMouse();
		this.eventHandler = new EventHandler();
		this.inputHandler = new InputHandler();
	}

	/** Checking that the tool is being used */
	public isEquipped(): boolean {
		return this.equipped;
	}

	/** Callback when the platform has changed, for example `PC -> Console` or `Mobile -> Console` */
	public onPlatformChanged(platform: typeof InputController.currentPlatform): void {
		this.prepareEvents(platform);

		// Reload GUIs
		this.hideGUI();
		this.displayGUI(true);
	}

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

	public abstract displayGUI(noAnimations?: boolean): void;

	public abstract hideGUI(): void;

	/** Activating the tool */
	public equip(): void {
		this.equipped = true;
		this.prepareEvents(InputController.currentPlatform);
		this.displayGUI();
	}

	/** Deactivating the tool */
	public unequip(): void {
		this.equipped = false;
		this.hideGUI();
		this.eventHandler.killAll();
		this.inputHandler.killAll();
	}
}
