import { Players } from "@rbxts/services";
import Signals from "./Signals";

export default class PlayerStateEvent {
	public static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect(() => this.playerCreated());
		this.playerCreated();
	}

	public static playerCreated() {
		while (Players.LocalPlayer.Character === undefined) {
			task.wait();
		}

		Signals.PLAYER.SPAWN.Fire();

		(Players.LocalPlayer.Character as Model).FindFirstChildOfClass("Humanoid")?.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});
	}
}
