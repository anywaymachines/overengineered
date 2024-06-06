import { Players } from "@rbxts/services";
import { Signals } from "client/event/Signals";
import { ObservableValue } from "shared/event/ObservableValue";
import type { PlayerModule } from "client/types/PlayerModule";

export namespace LocalPlayer {
	export const mouse = Players.LocalPlayer.GetMouse();
	export const character = new ObservableValue<Model | undefined>(undefined);
	export const humanoid = new ObservableValue<Humanoid | undefined>(undefined);
	export const rootPart = new ObservableValue<BasePart | undefined>(undefined);

	Players.LocalPlayer.CharacterAdded.Connect((_) => {
		if (!Players.LocalPlayer.HasAppearanceLoaded()) {
			Players.LocalPlayer.CharacterAppearanceLoaded.Wait();
		}

		playerSpawned();
	});
	if (Players.LocalPlayer.Character) {
		playerSpawned();
	}

	Players.LocalPlayer.CameraMaxZoomDistance = 512;

	function playerSpawned() {
		const char = Players.LocalPlayer.Character!;
		character.set(char);

		const h = char.WaitForChild("Humanoid") as Humanoid;
		h.Died.Once(() => {
			character.set(undefined);
			humanoid.set(undefined);
			rootPart.set(undefined);

			Signals.PLAYER.DIED.Fire();
		});

		humanoid.set(h);
		rootPart.set(char.WaitForChild("HumanoidRootPart") as Part);

		Signals.PLAYER.SPAWN.Fire();
	}

	/** Native `PlayerModule` library */
	export function getPlayerModule(): PlayerModule {
		const instance = Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
		return require(instance) as PlayerModule;
	}
}
