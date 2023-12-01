import { SlotsDatabase } from "server/SlotsDatabase";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class SaveSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => {
			const blocksCount = SlotsDatabase.instance.setSlot(
				player.UserId,
				data.index,
				(existing) => ({
					index: data.index,
					name: data.name,
					color: data.color,
					blocks: existing?.blocks ?? 0,
				}),
				data.save,
			);

			return { success: true, blocks: blocksCount };
		});
	}
}
