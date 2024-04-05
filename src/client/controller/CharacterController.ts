import { Players } from "@rbxts/services";
import { PartUtils } from "shared/utils/PartUtils";

export namespace CharacterController {
	export function initialize() {
		Players.PlayerAdded.Connect(preparePlayer);
		Players.GetPlayers().forEach(preparePlayer);
	}

	export function preparePlayer(plr: Player) {
		if (plr === Players.LocalPlayer) return;

		plr.CharacterAdded.Connect(() => {
			plr.CharacterAppearanceLoaded.Wait();
			updateCharacter(plr);
		});

		if (plr.Character) updateCharacter(plr);
	}

	export function updateCharacter(plr: Player) {
		PartUtils.applyToAllDescendantsOfType("BasePart", plr.Character!, (instance) => {
			instance.Massless = true;
			instance.EnableFluidForces = false;

			instance.CanCollide = false;
			instance.CanQuery = false;
			instance.CanTouch = false;
		});
	}
}
