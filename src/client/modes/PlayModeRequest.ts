import LogControl from "client/gui/static/LogControl";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SoundController from "../controller/SoundController";

export const requestMode = async (mode: PlayModes) => {
	const response = await Remotes.Client.GetNamespace("Ride").Get("SetPlayMode").CallServerAsync(mode);
	if (!response.success) {
		Logger.error(response.message);
		LogControl.instance.addLine(response.message!, Color3.fromRGB(255, 100, 100));
		SoundController.getSounds().Build.BlockPlaceError.Play();

		return;
	}
};
