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

		// Other's spawning
		plr.CharacterAdded.Connect(() => {
			if (!plr.HasAppearanceLoaded()) {
				print("need load cc");
				plr.CharacterAppearanceLoaded.Wait();
				print("loaded cc");
			}

			this.updateCharacter(plr);
		});

		// Other's update exist
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
