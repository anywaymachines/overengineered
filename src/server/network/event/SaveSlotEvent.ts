import PlayerDatabase from "server/PlayerDatabase";
import { SlotsDatabase } from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";

export default class SaveSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => {
			const pdata = SlotsDatabase.instance.getMeta(player.UserId, data.index);
			pdata.name = data.name;
			pdata.color = data.color;

			if (data.save) {
				const plot = SharedPlots.getPlotByOwnerID(player.UserId);
				SlotsDatabase.instance.setBlocks(player.UserId, data.index, BlocksSerializer.serialize(plot));
			}

			return { success: true };
		});
	}
}
