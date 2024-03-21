import { LoadingController } from "client/controller/LoadingController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import LogControl from "client/gui/static/LogControl";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export const requestMode = async (mode: PlayModes) => {
	LoadingController.show(`Changing play mode to ${mode}...`);

	try {
		Signals.LOCAL_PLAY_MODE_CHANGED.Fire(mode);

		const response = await Remotes.Client.GetNamespace("Ride").Get("SetPlayMode").CallServerAsync(mode);
		if (!response.success) {
			Logger.error(response.message);
			LogControl.instance.addLine(response.message!, Colors.red);
			SoundController.getSounds().Build.BlockPlaceError.Play();

			return;
		}
	} finally {
		LoadingController.hide();
	}
};
