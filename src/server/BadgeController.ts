import { BadgeService, Players } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { GameDefinitions } from "shared/data/GameDefinitions";

const logger = new Logger("BadgeController");

export namespace BadgeController {
	const badges = {
		PRE_BETA_2024: 2652394288127295,
	};

	export function initialize() {
		if (game.PlaceId !== GameDefinitions.PRODUCTION_PLACE_ID) {
			logger.info("Disabling on non-production place");
			return;
		}

		// PRE_BETA_2024
		Players.PlayerAdded.Connect((player) => {
			try {
				if ([2, 3].includes(player.GetRankInGroup(GameDefinitions.GROUP))) {
					BadgeService.AwardBadge(player.UserId, badges.PRE_BETA_2024);
					logger.warn(`Awarded PRE_BETA_2024 to ${player.Name}`);
				}
			} catch {
				logger.info(`Failed to give PRE_BETA_2024 to ${player.Name}`);
			}
		});

		logger.info("Loaded");
	}
}
