import FireEffect from "./FireEffect";
import ImpactSoundEffect from "./ImpactSoundEffect";
import SparksEffect from "./SparksEffect";

const Effects = {
	Sparks: new SparksEffect(),
	ImpactSound: new ImpactSoundEffect(),
	Fire: new FireEffect(),
} as const;

export default Effects;
export type ClientEffects = typeof Effects;
