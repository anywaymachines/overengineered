import { Players, UserInputService } from "@rbxts/services";
import EventHandler from "client/EventHandler";

/** A class for implementing the API for tools */
export default abstract class AbstractToolAPI {
	public gameUI: MyGui;
	public mouse: Mouse;
	public eventHandler: EventHandler;
	private equipped = false;

	constructor(gameUI: MyGui) {
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
	public abstract onPlatformChanged(): void;

	/** Activating the tool */
	public equip(): void {
		this.equipped = true;
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input) => this.onUserInput(input));
	}

	/** Deactivating the tool */
	public unequip(): void {
		this.equipped = false;
		this.eventHandler.killAll();
	}
}
