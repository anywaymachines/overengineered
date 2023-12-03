import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";
import SoundController from "../SoundController";

export const requestMode = async (mode: PlayModes) => {
	const response = await Remotes.Client.GetNamespace("Ride").Get("SetPlayMode").CallServerAsync(mode);
	if (!response.success) {
		print(response.message);
		LogControl.instance.addLine(response.message!, Color3.fromRGB(255, 100, 100));
		SoundController.getSounds().BuildingMode.BlockPlaceError.Play();

		return;
	}
};
