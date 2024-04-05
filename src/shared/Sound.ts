import { GameEnvironment } from "./data/GameEnvironment";

export namespace Sound {
	export function getWorldVolume(height: number) {
		return math.clamp(
			1 - (height / GameEnvironment.ZeroAirHeight) * (1 - GameEnvironment.MinSoundValue),
			GameEnvironment.MinSoundValue,
			1,
		);
	}
}
