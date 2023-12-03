import PlayerDatabase from "server/PlayerDatabase";
import SlotsDatabase from "server/SlotsDatabase";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class FetchSlotsRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("slots => fetch");

		Remotes.Server.GetNamespace("Slots").OnFunction("Fetch", (player) => this.emit(player));
	}

	public emit(player: Player) {
		const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
		const meta = SlotsDatabase.instance.getAllMeta(player.UserId);

		Logger.info(`Sharing ${player.Name}'s slot data`);

		return {
			success: true,
			purchasedSlots: playerData.purchasedSlots ?? 0,
			slots: meta.toSerialized(),
		};
	}
}
