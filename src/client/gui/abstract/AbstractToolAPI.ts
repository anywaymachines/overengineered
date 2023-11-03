import { Players, UserInputService } from "@rbxts/services";
import ClientSignals from "client/ClientSignals";
import GameInput from "client/GameControls";
import EventHandler from "client/event/EventHandler";

/** A class for implementing the API for tools */
export default abstract class AbstractToolAPI {
	public gameUI: GameUI;
	public mouse: Mouse;
	public eventHandler: EventHandler;
	private equipped = false;

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		this.mouse = Players.LocalPlayer.GetMouse();
		this.eventHandler = new EventHandler();
	}

	/** Checking that the tool is being used */
	public isEquipped(): boolean {
		return this.equipped;
	}

	/** The `UserInputService.InputBegan` callback */
	public abstract onUserInput(input: InputObject): void;

	/** Callback when the platform has changed, for example `PC -> Console` or `Mobile -> Console` */
	public onPlatformChanged(platform: typeof GameInput.currentPlatform): void {
		this.prepareEvents(platform);

		// Reload GUIs
		this.hideGUI();
		this.displayGUI(true);
	}

	public prepareEvents(platform: typeof GameInput.currentPlatform): void {
		this.eventHandler.killAll();
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input) => this.onUserInput(input));
		this.eventHandler.registerEvent(ClientSignals.PLATFORM_CHANGED, (newPlatform) =>
			this.onPlatformChanged(newPlatform),
		);
	}

	public abstract displayGUI(noAnimations?: boolean): void;

	public abstract hideGUI(): void;

	/** Activating the tool */
	public equip(): void {
		this.equipped = true;
		this.prepareEvents(GameInput.currentPlatform);
		this.displayGUI();
	}

	/** Deactivating the tool */
	public unequip(): void {
		this.equipped = false;
		this.hideGUI();
		this.eventHandler.killAll();
	}
}
