import PlayerDatabase from "server/PlayerDatabase";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class PlayerSettingsHandler {
	static init() {
		registerOnRemoteFunction(
			"Player",
			"UpdateSettings",
			<TKey extends keyof PlayerConfig>(player: Player, key: TKey, value: PlayerConfig[TKey]) => {
				const playerData = PlayerDatabase.instance.get(tostring(player.UserId));

				const newPlayerData = {
					...playerData,
					settings: {
						...(playerData.settings ?? {}),
						[key]: value,
					},
				};

				PlayerDatabase.instance.set(tostring(player.UserId), newPlayerData);
				return {
					success: true,
				};
			},
		);

		registerOnRemoteFunction("Player", "FetchSettings", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			return playerData.settings ?? {};
		});
	}
}
