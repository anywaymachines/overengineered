import { BadgeService, Players } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace BadgeController {
	const badges = {
		PRE_BETA_2024: 2652394288127295,
	};

	export function initialize() {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			Logger.warn("[BadgeController] Disabling on non-production place");
			return;
		}

		// PRE_BETA_2024
		Players.PlayerAdded.Connect((player) => {
			try {
				if ([2, 3].includes(player.GetRankInGroup(GameDefinitions.GROUP)) || (true as boolean)) {
					BadgeService.AwardBadge(player.UserId, badges.PRE_BETA_2024);
					Logger.warn(`[BadgeController] Awarded PRE_BETA_2024 to ${player.Name}`);
				}
			} catch {
				Logger.warn(`[BadgeController] Failed to give PRE_BETA_2024 to ${player.Name}`);
			}
		});

		Logger.info("[BadgeController] Loaded");
	}
}
