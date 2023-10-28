import { Players, UserInputService } from "@rbxts/services";
import EventHandler from "client/EventHandler";

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

	public isEquipped(): boolean {
		return this.equipped;
	}

	public abstract onUserInput(input: InputObject): void;

	public abstract onPlatformChanged(): void;

	public equip(): void {
		this.equipped = true;
		this.eventHandler.registerEvent(UserInputService.InputBegan, (input) => this.onUserInput(input));
	}

	public unequip(): void {
		this.equipped = false;
		this.eventHandler.killAll();
	}
}
