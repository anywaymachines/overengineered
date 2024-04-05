import { BlockManager } from "shared/building/BlockManager";
import { EffectBase } from "./EffectBase";

type Args = {
	readonly particle: ParticleEmitter;
	readonly isEnabled: boolean;
	readonly acceleration: Vector3;
};
export class ParticleEffect extends EffectBase<Args> {
	constructor() {
		super("particle_effect");
	}

	justRun({ particle, isEnabled, acceleration }: Args): void {
		if (!particle || !particle.Parent) return;

		const part = particle.Parent;
		if (!BlockManager.isActiveBlockPart(part)) return;

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
	}
}
