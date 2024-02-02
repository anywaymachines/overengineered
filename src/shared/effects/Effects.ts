import FireEffect from "./FireEffect";
import ImpactSoundEffect from "./ImpactSoundEffect";
import ParticleEffect from "./ParticleEffect";
import SoundEffect from "./SoundEffect";
import SparksEffect from "./SparksEffect";

const Effects = {
	Sparks: new SparksEffect(),
	ImpactSound: new ImpactSoundEffect(),
	Fire: new FireEffect(),
	Sound: new SoundEffect(),
	Particle: new ParticleEffect(),
} as const;
export default Effects;
