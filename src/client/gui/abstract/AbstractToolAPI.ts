import { Players, UserInputService } from "@rbxts/services";
import EventHandler from "client/event/EventHandler";
import Logger from "shared/Logger";

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
	public onPlatformChanged(platform: string): void {
		this.preparePlatformEvents();

		// Reload GUIs
		this.hideGUI();
		this.displayGUI(true);
	}

	public preparePlatformEvents(): void {
		this.eventHandler.killAll();
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input) => this.onUserInput(input));
	}

	public abstract displayGUI(noAnimations?: boolean): void;

	public abstract hideGUI(): void;

	/** Activating the tool */
	public equip(): void {
		Logger.info("Tool equipped");
		this.equipped = true;
		this.displayGUI();
	}

	/** Deactivating the tool */
	public unequip(): void {
		Logger.info("Tool unequipped");
		this.equipped = false;
		this.hideGUI();
		this.eventHandler.killAll();
	}
}
