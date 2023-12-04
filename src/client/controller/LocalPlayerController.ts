import { Players } from "@rbxts/services";
import Signals from "client/event/Signals";
import { PlayerModule } from "client/types/PlayerModule";

export default class LocalPlayerController {
	static isRunning: boolean;
	static humanoid: Humanoid | undefined;

	static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect((character) => {
			this.onPlayerAdded();
		});

		this.onPlayerAdded();
	}

	private static onPlayerAdded() {
		while (!Players.LocalPlayer.Character) {
			wait(0.1);
		}

		this.humanoid = Players.LocalPlayer.Character.WaitForChild("Humanoid") as Humanoid;

		Signals.PLAYER.SPAWN.Fire();

		this.humanoid.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});

		this.humanoid.Running.Connect((speed) => {
			this.isRunning = speed > (this.humanoid!.WalkSpeed as number) / 2;
		});
	}

	static getPlayerModule(): PlayerModule {
		return require(
			Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript,
		) as PlayerModule;
	}
}
