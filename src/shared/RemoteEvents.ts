import { ImpactBreakAutoC2SRemoteEvent } from "shared/block/impact/ImpactBreakAutoC2SRemoteEvent";
import { ExplosionEffect } from "shared/effects/ExplosionEffect";
import { FireEffect } from "shared/effects/FireEffect";
import { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import { ParticleEffect } from "shared/effects/ParticleEffect";
import { SoundEffect } from "shared/effects/SoundEffect";
import { SparksEffect } from "shared/effects/SparksEffect";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export type ExplodeArgs = {
	readonly part: BasePart;
	readonly radius: number;
	readonly pressure: number;
	readonly isFlammable: boolean;
};

export namespace RemoteEvents {
	export function initializeVisualEffects(host: GameHostBuilder) {
		host.services.registerSingletonClass(SparksEffect).autoInit();
		host.services.registerSingletonClass(ImpactSoundEffect).autoInit();
		host.services.registerSingletonClass(ExplosionEffect).autoInit();
		host.services.registerSingletonClass(FireEffect).autoInit();
		host.services.registerSingletonClass(SoundEffect).autoInit();
		host.services.registerSingletonClass(ParticleEffect).autoInit();
	}

	export const Burn = new AutoC2SRemoteEvent<BasePart[]>("burn");
	export const ImpactBreak = new ImpactBreakAutoC2SRemoteEvent("impact_break");
	export const Explode = new AutoC2SRemoteEvent<ExplodeArgs>("explode");

	// empty method just to trigger the constructors
	export function initialize() {}
}
