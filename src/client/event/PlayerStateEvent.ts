import { Players } from "@rbxts/services";
import Signals from "./Signals";

export default class PlayerStateEvent {
	private static registerCharacterEvents() {
		(Players.LocalPlayer.Character as Model).FindFirstChildOfClass("Humanoid")?.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});

		this.emitPlayerSpawn();
	}

	static emitPlayerSpawn() {
		while (Players.LocalPlayer.Character === undefined) {
			task.wait();
		}

		Signals.PLAYER.SPAWN.Fire();
	}

	static subscribe() {
		Players.LocalPlayer.CharacterAdded.Connect(() => this.emitPlayerSpawn());

		Signals.PLAYER.SPAWN.Connect(() => this.registerCharacterEvents());
	}
}
