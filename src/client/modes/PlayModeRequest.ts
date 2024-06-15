import { LoadingController } from "client/controller/LoadingController";
import { SoundController } from "client/controller/SoundController";
import { Colors } from "client/gui/Colors";
import { LogControl } from "client/gui/static/LogControl";
import { CustomRemotes } from "shared/Remotes";

export const requestMode = (mode: PlayModes) => {
	LoadingController.show(`Changing play mode to ${mode}...`);

	try {
		const response = CustomRemotes.modes.set.send(mode);
		if (!response.success) {
			$err(response.message);
			LogControl.instance.addLine(response.message!, Colors.red);
			SoundController.getSounds().Build.BlockPlaceError.Play();

			return;
		}
	} finally {
		LoadingController.hide();
	}
};
