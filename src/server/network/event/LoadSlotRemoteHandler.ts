import SlotsDatabase from "server/SlotsDatabase";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import BlocksSerializer from "server/plots/BlocksSerializer";
import ServerPlots from "server/plots/ServerPlots";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";

export default class LoadSlotRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("slots => load");

		Remotes.Server.GetNamespace("Slots").OnFunction("Load", (player, index) => this.emit(player, index));
	}

	public emit(player: Player, index: number) {
		const blocks = SlotsDatabase.instance.getBlocks(player.UserId, index);
		if (!blocks || blocks.size() === 0) {
			return {
				success: false,
				message: "Slot is empty",
			};
		}

		Logger.info(`Loading ${player.Name}'s slot ${index}`);

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		ServerPlots.clearAllBlocks(plot);
		BlocksSerializer.deserialize(plot, blocks);

		return { success: true };
	}
}
