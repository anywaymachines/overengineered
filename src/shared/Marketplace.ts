import { MarketplaceService } from "@rbxts/services";
import { Throttler } from "shared/Throttler";

export namespace Marketplace {
	export namespace Gamepass {
		export function has(player: Player, gamepassId: number) {
			const req = Throttler.retryOnFail<boolean>(3, 1, () =>
				MarketplaceService.UserOwnsGamePassAsync(player.UserId, gamepassId),
			);

			if (!req.success) {
				$warn(req.error_message);
			}

			return req.success ? req.message : false;
		}

		export function getPrice(gamepassId: number) {
			const req = Throttler.retryOnFail<string>(3, 1, () => {
				const data = MarketplaceService.GetProductInfo(gamepassId, Enum.InfoType.GamePass).PriceInRobux;
				return data ? `${data} R$` : "Off-sale";
			});

			if (!req.success) {
				$warn(req.error_message);
			}

			return req.success ? req.message : "? R$";
		}
	}
}
