import { RobloxUnit } from "shared/RobloxUnit";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace GameEnvironment {
	export const EarthGravity = GameDefinitions.APRIL_FOOLS ? 60 : 180;
	export const EarthAirDensity = 0.2;

	export const ZeroGravityHeight = GameDefinitions.APRIL_FOOLS ? RobloxUnit.Meters_To_Studs(100) : 30000;
	export const ZeroAirHeight = 20000;

	export const MinSoundValue = 0.01;
}
