import PlayerDatabase from "server/PlayerDatabase";
import { registerOnRemoteEvent, registerOnRemoteFunction } from "./RemoteHandler";

export default class PlayerSettingsHandler {
	static init() {
		registerOnRemoteEvent("Player", "UpdateSettings", (player: Player, data: { key: string; value: string }) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));

			const newPlayerData = {
				...playerData,
				settings: {
					...(playerData.settings ?? {}),
					[data.key]: data.value,
				},
			};

			PlayerDatabase.instance.set(tostring(player.UserId), newPlayerData);
		});

		registerOnRemoteFunction("Player", "FetchSettings", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			return playerData.settings ?? {};
		});
	}
}
