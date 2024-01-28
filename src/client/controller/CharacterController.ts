import { Players } from "@rbxts/services";
import PartUtils from "shared/utils/PartUtils";

export default class CharacterController {
	public static initialize() {
		Players.PlayerAdded.Connect((plr) => this.preparePlayer(plr));

		Players.GetPlayers().forEach((plr) => {
			this.preparePlayer(plr);
		});
	}

	public static preparePlayer(plr: Player) {
		if (plr === Players.LocalPlayer) return;

		plr.CharacterAdded.Connect(() => {
			plr.CharacterAppearanceLoaded.Wait();

			this.updateCharacter(plr);
		});

		if (plr.Character) this.updateCharacter(plr);
	}

	public static updateCharacter(plr: Player) {
		print("updateCharacter");
		PartUtils.applyToAllDescendantsOfType("BasePart", plr.Character!, (instance) => {
			instance.Massless = true;
			instance.EnableFluidForces = false;

			instance.CanCollide = false;
			instance.CanQuery = false;
			instance.CanTouch = false;
		});
	}
}
