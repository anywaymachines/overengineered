import PlayerDatabase from "server/PlayerData";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";

export default class SaveSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => {
			const pdata = PlayerDatabase.getSlot(player, data.index);
			pdata.name = data.name;
			pdata.color = data.color;

			if (data.save) {
				const plot = SharedPlots.getPlotByOwnerID(player.UserId);
				pdata.data = BlocksSerializer.serialize(plot);
			}

			return { success: true };
		});
	}
}
