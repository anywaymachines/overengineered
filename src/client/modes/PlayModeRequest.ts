import { LoadingController } from "client/controller/LoadingController";
import { SoundController } from "client/controller/SoundController";
import { Colors } from "client/gui/Colors";
import { LogControl } from "client/gui/static/LogControl";
import { CustomRemotes } from "shared/Remotes";

let changing = false;
export const requestMode = (mode: PlayModes) => {
	if (changing) return;
	LoadingController.show(`Changing play mode to ${mode}...`);

	try {
		changing = true;
		const response = CustomRemotes.modes.set.send(mode);
		if (!response.success) {
			$warn(response.message);
			LogControl.instance.addLine(response.message!, Colors.red);
			SoundController.getSounds().Build.BlockPlaceError.Play();

			return;
		}
	} finally {
		changing = false;
		LoadingController.hide();
	}
};
