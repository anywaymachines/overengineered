import { MarketplaceService } from "@rbxts/services";

export namespace Marketplace {
	export namespace Gamepass {
		export function has(player: Player, gamepassId: number) {
			let err: string | undefined;
			for (let i = 0; i < 3; i++) {
				try {
					return MarketplaceService.UserOwnsGamePassAsync(player.UserId, gamepassId);
				} catch (error) {
					// eslint-disable-next-line no-ex-assign
					error = err;
					task.wait(1 + i);
				}
			}

			$warn(
				"Couldn't connect to Roblox to check your gamepasses inventory. This is NOT a bug. Try to rejoin the game",
			);

			return false;
		}

		export function getPrice(gamepassId: number) {
			let err: string | undefined;
			for (let i = 0; i < 3; i++) {
				try {
					const data = MarketplaceService.GetProductInfo(gamepassId, Enum.InfoType.GamePass).PriceInRobux;
					return data ? `${data} R$` : "Off-sale";
				} catch (error) {
					// eslint-disable-next-line no-ex-assign
					error = err;
					task.wait(1 + i);
				}
			}

			$warn("Couldn't connect to Roblox to get gamepass info. This is NOT a bug. Try to rejoin the game");

			return "? R$";
		}
	}
}
