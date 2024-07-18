import { BadgeService } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";

export class BadgeController extends HostedService {
	static initializeIfProd(host: GameHostBuilder) {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			return;
		}

		host.services.registerService(this);
	}

	private readonly badges = {
		PRE_BETA_2024: 2652394288127295,
	} as const;

	constructor() {
		super();

		// PRE_BETA_2024
		this.event.subscribeCollectionAdded(PlayerWatcher.players, (player) => {
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
