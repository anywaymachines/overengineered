import { SlotsDatabase } from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import ServerPlots from "server/plots/ServerPlots";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";

export default class LoadSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot load event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Load", (player, index) => {
			const blocks = SlotsDatabase.instance.getBlocks(player.UserId, index);
			if (!blocks || blocks.size() === 0) {
				return {
					success: false,
					message: "Slot is empty",
				};
			}

			const plot = SharedPlots.getPlotByOwnerID(player.UserId);
			ServerPlots.clearAllBlocks(plot);
			BlocksSerializer.deserialize(plot, blocks);

			return { success: true };
		});
	}
}
