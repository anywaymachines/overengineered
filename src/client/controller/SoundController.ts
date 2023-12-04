import { Players, RunService } from "@rbxts/services";
import GuiController from "./GuiController";
import LocalPlayerController from "./LocalPlayerController";

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
};

/** A class for controlling sounds and their effects */
export default class SoundController {
	public static initialize() {}

	public static getSounds(): Sounds {
		return GuiController.getGameUI<{ Sounds: Sounds }>().Sounds;
	}

	public static randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}
}
