import PlayerDatabase from "server/PlayerDatabase";
import SlotsDatabase from "server/SlotsDatabase";
import Logger from "shared/Logger";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class FetchSlotsRemoteHandler {
	static init() {
		registerOnRemoteFunction("Slots", "Fetch", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			const meta = SlotsDatabase.instance.getAllMeta(player.UserId);

			Logger.info(`Sharing ${player.Name}'s slot data`);

			return {
				success: true,
				purchasedSlots: playerData.purchasedSlots ?? 0,
				slots: meta.toSerialized(),
			};
		});
	}
}
