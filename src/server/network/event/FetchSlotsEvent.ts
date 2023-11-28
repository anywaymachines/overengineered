import PlayerDatabase from "server/PlayerDatabase";
import { SlotsDatabase } from "server/SlotsDatabase";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class FetchSlotEvent {
	static initialize(): void {
		Logger.info("Loading fetch Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Fetch", (player) => {
			const playerData = PlayerDatabase.instance.get(tostring(player.UserId));
			const meta = SlotsDatabase.instance.getAllMeta(player.UserId);

			const slots: SlotsResponse["slots"] = meta.map((slot, i) => {
				return {
					color: slot.color ?? [255, 255, 255],
					name: slot.name ?? "Slot " + (i + 1),
					blocks: slot.blocks ?? 0,
				};
			});

			return {
				success: true,
				purchasedSlots: playerData.purchasedSlots ?? 0,
				slots,
			};
		});
	}
}
