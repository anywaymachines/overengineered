import GuiController from "./GuiController";

declare type Sounds = Folder & {
	BuildingMode: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	RideMode: Folder & {
		RideStart: Sound;
	};
	Click: Sound;
};

/** A class for controlling sounds and their effects */
export default class SoundController {
	public static getSounds(): Sounds {
		return GuiController.getGameUI<{ Sounds: Sounds }>().Sounds;
	}

	public static randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}
}
