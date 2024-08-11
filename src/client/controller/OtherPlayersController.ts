import { Players } from "@rbxts/services";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";
import { PartUtils } from "shared/utils/PartUtils";

class MakeMassless extends HostedService {
	constructor() {
		super();

		function preparePlayer(plr: Player) {
			function updateCharacter(plr: Player) {
				PartUtils.applyToAllDescendantsOfType("BasePart", plr.Character!, (instance) => {
					instance.Massless = true;
				});
			}

			if (plr === Players.LocalPlayer) return;

			plr.CharacterAdded.Connect(() => {
				updateCharacter(plr);
			});

			if (plr.Character) updateCharacter(plr);
		}

		this.onEnable(() => {
			PlayerWatcher.onJoin(preparePlayer);
			Players.GetPlayers().forEach((value) => preparePlayer(value));
		});
	}
}

export namespace OtherPlayersController {
	export function initializeMassless(host: GameHostBuilder): void {
		host.services.registerService(MakeMassless);
	}
}
