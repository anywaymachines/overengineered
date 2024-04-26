import { BadgeService, Players } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace BadgeController {
	const badges = {
		PRE_BETA_2024: 2652394288127295,
	};

	export function initialize() {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			Logger.warning("[BadgeController] Disabling on non-production place");
			return;
		}

		// PRE_BETA_2024
		Players.PlayerAdded.Connect((player) => {
			try {
				if ([2, 3].includes(player.GetRankInGroup(GameDefinitions.GROUP)) || (true as boolean)) {
					BadgeService.AwardBadge(player.UserId, badges.PRE_BETA_2024);
					Logger.warning(`[BadgeController] Awarded PRE_BETA_2024 to ${player.Name}`);
				}
			} catch {
				Logger.warning(`[BadgeController] Failed to give PRE_BETA_2024 to ${player.Name}`);
			}
		});

		Logger.info("[BadgeController] Loaded");
	}
}
