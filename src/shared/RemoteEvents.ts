import { ImpactBreakAutoC2SRemoteEvent } from "shared/block/impact/ImpactBreakAutoC2SRemoteEvent";
import { ExplosionEffect } from "shared/effects/ExplosionEffect";
import { FireEffect } from "shared/effects/FireEffect";
import { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import { ParticleEffect } from "shared/effects/ParticleEffect";
import { SoundEffect } from "shared/effects/SoundEffect";
import { SparksEffect } from "shared/effects/SparksEffect";
import { AutoC2SRemoteEvent } from "./event/C2SRemoteEvent";

export namespace RemoteEvents {
	export namespace Effects {
		export const Sparks = new SparksEffect();
		export const ImpactSound = new ImpactSoundEffect();
		export const Explosion = new ExplosionEffect();
		export const Fire = new FireEffect();
		export const Sound = new SoundEffect();
		export const Particle = new ParticleEffect();
	}

	export const Burn = new AutoC2SRemoteEvent<BasePart[]>("burn");
	export const ImpactBreak = new ImpactBreakAutoC2SRemoteEvent("impact_break");

	// empty method just to trigger the constructors
	export function initialize() {}
}
