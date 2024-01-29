import { Players } from "@rbxts/services";
import Signals from "client/event/Signals";
import { PlayerModule } from "client/types/PlayerModule";
import PartUtils from "shared/utils/PartUtils";

export default class LocalPlayerController {
	static isRunning: boolean;
	static humanoid: Humanoid | undefined;

	static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect((_) => {
			Players.LocalPlayer.CharacterAppearanceLoaded.Wait();
			this.onPlayerAdded();
		});

		this.onPlayerAdded();
	}

	private static onPlayerAdded() {
		PartUtils.applyToAllDescendantsOfType("BasePart", Players.LocalPlayer.Character!, (part) => {
			part.EnableFluidForces = false;
		});

		this.humanoid = Players.LocalPlayer.Character!.WaitForChild("Humanoid") as Humanoid;

		this.humanoid.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});

		this.humanoid.Running.Connect((speed) => {
			this.isRunning = speed > (this.humanoid!.WalkSpeed as number) / 2;
		});

		Signals.PLAYER.SPAWN.Fire();
	}

	static getPlayerModuleInstance(): ModuleScript {
		return Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
	}

	static getPlayerModule(): PlayerModule {
		return require(this.getPlayerModuleInstance()) as PlayerModule;
	}
}
