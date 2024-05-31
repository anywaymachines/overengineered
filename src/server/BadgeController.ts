import { BadgeService } from "@rbxts/services";
import { PlayerWatcher } from "server/PlayerWatcher";
import { ControllerInitializer } from "shared/component/Controller";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { IController } from "shared/component/Controller";

export namespace BadgeController {
	export function initializeIfProd(parent: IController, di: DIContainer) {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			return;
		}

		return parent.parent(di.regResolve(BadgeControllerC));
	}
}

class BadgeControllerC extends ControllerInitializer {
	private readonly badges = {
		PRE_BETA_2024: 2652394288127295,
	} as const;

	constructor() {
		super();

		// PRE_BETA_2024
		PlayerWatcher.onJoinEvt(this.event, (player) => {
			player.CharacterAdded.Once(() => {
				try {
					if ([2, 3].includes(player.GetRankInGroup(GameDefinitions.GROUP))) {
						if (BadgeService.UserHasBadgeAsync(player.UserId, this.badges.PRE_BETA_2024)) return;

						BadgeService.AwardBadge(player.UserId, this.badges.PRE_BETA_2024);
						$log(`Awarded PRE_BETA_2024 to ${player.Name}`);
					}
				} catch {
					$log(`Failed to give PRE_BETA_2024 to ${player.Name}`);
				}
			});
		});
	}
}
