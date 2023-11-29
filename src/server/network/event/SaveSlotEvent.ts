import { SlotsDatabase } from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";

export default class SaveSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => {
			const meta = [...SlotsDatabase.instance.getMeta(player.UserId)];

			meta.push({
				index: data.index,
				name: data.name,
				color: data.color,
				blocks: meta[data.index]?.blocks ?? 0,
			});
			SlotsDatabase.instance.setMeta(player.UserId, meta);

			if (data.save) {
				const plot = SharedPlots.getPlotByOwnerID(player.UserId);
				const blocks = BlocksSerializer.serialize(plot);
				SlotsDatabase.instance.setBlocks(player.UserId, data.index, blocks);
			}

			return { success: true };
		});
	}
}
