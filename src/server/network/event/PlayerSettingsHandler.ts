import { Players } from "@rbxts/services";
import PlayerDatabase from "server/PlayerDatabase";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import Remotes from "shared/Remotes";

export default class PlayerSettingsHandler extends BaseRemoteHandler {
	constructor() {
		super("player => settings");

		Players.PlayerAdded.Connect((player) => {});

		// Update request
		Remotes.Server.GetNamespace("Player").OnEvent("UpdateSettings", (player, data) => this.emit(player, data));
		Remotes.Server.GetNamespace("Player").OnFunction("FetchSettings", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			return playerData.settings ?? {};
		});
	}

	public emit(player: Player, data: { key: string; value: string }) {
		const playerData = PlayerDatabase.instance.get(tostring(player.UserId));

		const newPlayerData = {
			...playerData,
			settings: {
				...(playerData.settings ?? {}),
				[data.key]: data.value,
			},
		};

		PlayerDatabase.instance.set(tostring(player.UserId), newPlayerData);
	}
}
