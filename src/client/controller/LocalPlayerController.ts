import { Players } from "@rbxts/services";
import Signals from "client/event/Signals";
import { PlayerModule } from "client/types/PlayerModule";
import PartUtils from "shared/utils/PartUtils";

export default class LocalPlayerController {
	static humanoid: Humanoid | undefined;

	static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect((_) => {
			if (!Players.LocalPlayer.HasAppearanceLoaded()) Players.LocalPlayer.CharacterAppearanceLoaded.Wait();

			this.onPlayerAdded();
		});

		this.onPlayerAdded();
	}

	private static onPlayerAdded() {
		this.humanoid = Players.LocalPlayer.Character!.WaitForChild("Humanoid") as Humanoid;

		this.humanoid.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});

		this.disableCharacterFluidForces();

		Signals.PLAYER.SPAWN.Fire();
	}

	/** By default, character has `EnableFluidForces`, but because of the huge `Workspace.AirDensity`, it just flies like a feather */
	private static disableCharacterFluidForces() {
		PartUtils.applyToAllDescendantsOfType("BasePart", Players.LocalPlayer.Character!, (part) => {
			part.EnableFluidForces = false;
		});
	}

	private static getPlayerModuleInstance(): ModuleScript {
		return Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
	}

	/** Native `PlayerModule` library */
	static getPlayerModule(): PlayerModule {
		return require(this.getPlayerModuleInstance()) as PlayerModule;
	}
}
