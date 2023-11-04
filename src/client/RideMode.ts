import Remotes from "shared/NetworkDefinitions";
import ClientSignals from "./ClientSignals";
import PlayerGameUI from "./gui/PlayerGameUI";

export default class RideMode {
	static initialize() {
		ClientSignals.RIDE_REQUEST.Connect(async () => {
			await this.start();
		});
	}

	static async start() {
		PlayerGameUI.gameUI.Sounds.Ride.RideStart.Play();

		// Terminate GUIs
		PlayerGameUI.actionBarGUI.terminate();
		PlayerGameUI.hotbarGUI.terminate();

		Remotes.Client.GetNamespace("Ride").Get("RideStart").CallServerAsync();
	}
}
