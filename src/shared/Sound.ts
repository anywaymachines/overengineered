import GameEnvironment from "./GameEnvironment";

const Sound = {
	getWorldVolume(height: number) {
		return math.clamp(
			1 - (height / GameEnvironment.ZeroAirHeight) * (1 - GameEnvironment.MinSoundValue),
			GameEnvironment.MinSoundValue,
			1,
		);
	},
} as const;
export default Sound;
