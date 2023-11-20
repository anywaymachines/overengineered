import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";

export default class RideStartEvent {
	static initialize(): void {
		Logger.info("Loading RideStart event listener...");

		Remotes.Server.GetNamespace("Ride").OnFunction("RideStartRequest", (player) => this.startRide(player));
	}

	private static startRide(player: Player): void {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);

		const blocks = plot.WaitForChild("Blocks");
		PartUtils.switchDescendantsAnchor(blocks, false);
		PartUtils.switchDescendantsNetworkOwner(blocks, player);
	}
}
