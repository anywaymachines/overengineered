import { Players } from "@rbxts/services";

/** A class for creating Roblox events that will work as long as the player is alive */
export default class AliveEventsHandler {
	private static events: RBXScriptConnection[] = [];

	public static initialize() {
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** The function of registering a pseudo-permanent event that will turn off when the player dies
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	public static registerAliveEvent(signal: RBXScriptSignal, callback: Callback): void {
		this.events.push(signal.Connect((_) => callback(_)));
	}

	private static terminate() {
		for (let i = 0; i < this.events.size(); i++) {
			const event = this.events[i];
			event.Disconnect();
		}

		this.events.clear();
	}
}
