import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class RideStartEvent {
	static initialize(): void {
		Logger.info("Loading RideStart event listener...");

		Remotes.Server.GetNamespace("Ride").OnFunction("RideStartRequest", (player) => this.startRide(player));
	}

	private static startRide(player: Player): Response {
		if (!PlayerUtils.isAlive(player)) return { success: false, message: "You are not alive" };

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		const blocksChildren = blocks.GetChildren();

		// Check is required blocks exist
		for (let i = 0; i < BlockRegistry.RequiredBlocks.size(); i++) {
			const requiredBlock = BlockRegistry.RequiredBlocks[i];
			if (!blocksChildren.find((model) => model.GetAttribute("id") === requiredBlock.id)) {
				return {
					success: false,
					message: requiredBlock.getDisplayName() + " not found",
				};
			}
		}

		// Teleport player to seat
		const Humanoid = PartUtils.switchDescendantsAnchor(blocks, false);
		PartUtils.switchDescendantsNetworkOwner(blocks, player);

		return {
			success: true,
		};
	}
}
