import { Colors } from "client/gui/Colors";
import LogControl from "client/gui/static/LogControl";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SoundController from "client/controller/SoundController";

export const requestMode = async (mode: PlayModes) => {
	const response = await Remotes.Client.GetNamespace("Ride").Get("SetPlayMode").CallServerAsync(mode);
	if (!response.success) {
		Logger.error(response.message);
		LogControl.instance.addLine(response.message!, Colors.red);
		SoundController.getSounds().Build.BlockPlaceError.Play();

		return;
	}
};
