import PlayerDatabase from "server/PlayerDatabase";
import { SlotsDatabase } from "server/SlotsDatabase";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class FetchSlotEvent {
	static initialize(): void {
		Logger.info("Loading fetch Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Fetch", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			const meta = SlotsDatabase.instance.getMeta(player.UserId);

			return {
				success: true,
				purchasedSlots: playerData.purchasedSlots ?? 0,
				slots: meta,
			};
		});
	}
}
