import GameEnvironmentController from "./GameEnvironmentController";
import GuiController from "./GuiController";
import MusicController from "./sound/MusicController";

declare type Sounds = {
	BuildingMode: {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	RideMode: {
		RideStart: Sound;
	};
	Click: Sound;
	Music: {
		Space: Folder & { [key: string]: Sound };
	};
};

/** A class for controlling sounds and their effects */
export default class SoundController {
	public static initialize() {
		MusicController.initialize();
	}

	public static getSounds(): Sounds {
		return GuiController.getGameUI<{ Sounds: Sounds }>().Sounds;
	}

	public static randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}

	public static getWorldVolume(volume: number) {
		return this.applyPropagationPhysics(volume);
	}

	private static applyPropagationPhysics(currentLevel: number) {
		const volumePercentage = math.clamp(
			1 -
				(GameEnvironmentController.currentHeight / GameEnvironmentController.NoSoundHeight) *
					(1 - GameEnvironmentController.MinSoundValue),
			GameEnvironmentController.MinSoundValue,
			1,
		);

		return currentLevel * volumePercentage;
	}
}
