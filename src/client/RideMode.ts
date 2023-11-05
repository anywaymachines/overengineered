import Remotes from "shared/NetworkDefinitions";
import Signals from "./core/network/Signals";
import MainGUI from "./gui/MainGUI";

export default class RideMode {
	static initialize() {
		Signals.RIDE_REQUEST.Connect(async () => {
			await this.start();
		});
	}

	static async start() {
		MainGUI.gameUI.Sounds.Ride.RideStart.Play();

		// Terminate GUIs
		MainGUI.actionBarGUI.terminate();
		MainGUI.hotbarGUI.terminate();

		Remotes.Client.GetNamespace("Ride").Get("RideStart").CallServerAsync();
	}
}
