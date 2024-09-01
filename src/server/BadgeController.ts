import { BadgeService } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";

export class BadgeController extends HostedService {
	static initializeIfProd(host: GameHostBuilder) {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) return;

		host.services.registerService(this);
	}

	private readonly badges = {
		PRE_BETA: 2652394288127295,
		BETA: 660085287868968,
	} as const;

	constructor() {
		super();

		this.event.subscribeCollectionAdded(PlayerWatcher.players, (player) => {
			player.CharacterAdded.Once(() => {
				try {
					// BETA badge
					if (!BadgeService.UserHasBadgeAsync(player.UserId, this.badges.BETA)) {
						BadgeService.AwardBadge(player.UserId, this.badges.BETA);
					}

					// PRE-Beta badge
					if (GameDefinitions.getRank(player) === 2) {
						if (!BadgeService.UserHasBadgeAsync(player.UserId, this.badges.PRE_BETA)) {
							BadgeService.AwardBadge(player.UserId, this.badges.PRE_BETA);
						}
					}
				} catch {
					$log(`Failed to give badge to ${player.Name}`);
				}
			});
		});
	}
}
