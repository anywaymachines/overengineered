import SharedPlots from "shared/building/SharedPlots";
import { registerOnRemoteEvent } from "./RemoteHandler";

export default class SitRemoteHandler {
	static init() {
		registerOnRemoteEvent("Ride", "Sit", (player: Player) => {
			const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;

			if (hrp.Sit) {
				return;
			}

			const plot = SharedPlots.getPlotByOwnerID(player.UserId);
			const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

			const vehicleSeatModel = blocks.find((model) => model.GetAttribute("id") === "vehicleseat") as Model;
			const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
			vehicleSeat.Sit(hrp);
		});
	}
}
