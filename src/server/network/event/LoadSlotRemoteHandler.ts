import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import ServerPlots from "server/plots/ServerPlots";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class LoadSlotRemoteHandler {
	static init() {
		registerOnRemoteFunction("Slots", "Load", (player, index) => {
			const blocks = SlotsDatabase.instance.getBlocks(player.UserId, index);
			if (blocks === undefined || blocks.size() === 0) {
				return {
					success: false,
					message: "Slot is empty",
				};
			}

			Logger.info(`Loading ${player.Name}'s slot ${index}`);

			const plot = SharedPlots.getPlotByOwnerID(player.UserId);
			ServerPlots.clearAllBlocks(plot);
			const dblocks = BlocksSerializer.current.deserialize(blocks);
			BlocksSerializer.deserialize(plot, dblocks);

			return { success: true };
		});
	}
}
