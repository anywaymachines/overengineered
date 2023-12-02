import BlockLogicController from "../BlockLogicController";
import PlayModeController from "../PlayModeController";
import SoundController from "../SoundController";

export default class RideMode {
	public static initialize() {
		PlayModeController.instance.playmode.subscribe((mode: PlayModes | undefined, prev: PlayModes | undefined) => {
			if (prev === "build" && mode === "ride") {
				BlockLogicController.setupBlocks();
				SoundController.getSounds().RideMode.RideStart.Play();
			}
		});
	}
}
