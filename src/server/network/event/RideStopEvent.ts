import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class RideStopEvent {
	static initialize(): void {
		Logger.info("Loading Ride stop event listener...");

		Remotes.Server.GetNamespace("Ride").OnFunction("RideStopRequest", (player) => this.stopRide(player));
	}

	private static stopRide(player: Player): Response {
		if (!PlayerUtils.isAlive(player)) return { success: false, message: "You are not alive" };

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		blocks.ClearAllChildren();

		const blocksToLoad = SlotsDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
		if (blocksToLoad) BlocksSerializer.deserialize(plot, blocksToLoad);

		// return building

		// teleport player to plot

		return {
			success: true,
		};
	}
}
