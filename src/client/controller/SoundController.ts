import GuiController from "./GuiController";

/** A class for controlling sounds and their effects */
export default class SoundController {
	static readonly Sounds = GuiController.getGameUI().Sounds;

	public static randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}
}
