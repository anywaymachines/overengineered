import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";
import SoundController from "./SoundController";
import BlockLogicController from "./BlockLogicController";
import ObservableValue from "shared/event/ObservableValue";

export default class PlayModeController {
	public static readonly instance = new PlayModeController();
	public readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);

	constructor() {
		this.playmode.subscribe((mode, prev) => {
			this.modeChanged(mode, prev);
		});

		Remotes.Client.GetNamespace("Ride")
			.Get("SetPlayModeOnClient")
			.SetCallback((mode) => {
				this.playmode.set(mode);
				return { success: true };
			});
	}

	private modeChanged(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (prev === "build" && mode === "ride") {
			BlockLogicController.setupBlocks();
			SoundController.getSounds().RideMode.RideStart.Play();
		}
	}

	public async requestMode(mode: PlayModes) {
		const response = await Remotes.Client.GetNamespace("Ride").Get("SetPlayMode").CallServerAsync(mode);
		if (!response.success) {
			print(response.message);
			LogControl.instance.addLine(response.message!, Color3.fromRGB(255, 100, 100));
			SoundController.getSounds().BuildingMode.BlockPlaceError.Play();

			return;
		}
	}
}
