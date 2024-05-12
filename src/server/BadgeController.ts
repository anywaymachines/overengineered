import { BadgeService, Players } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace BadgeController {
	const badges = {
		PRE_BETA_2024: 2652394288127295,
	};

	export function initialize() {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			$log("Disabling on non-production place");
			return;
		}

		// PRE_BETA_2024
		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Once(() => {
				try {
					if ([2, 3].includes(player.GetRankInGroup(GameDefinitions.GROUP))) {
						if (BadgeService.UserHasBadgeAsync(player.UserId, badges.PRE_BETA_2024)) return;

						BadgeService.AwardBadge(player.UserId, badges.PRE_BETA_2024);
						$log(`Awarded PRE_BETA_2024 to ${player.Name}`);
					}
				} catch {
					$log(`Failed to give PRE_BETA_2024 to ${player.Name}`);
				}
			});
		});

		$log("Loaded");
	}
}
