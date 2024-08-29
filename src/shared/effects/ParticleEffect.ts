import { BlockManager } from "shared/building/BlockManager";
import { EffectBase } from "shared/effects/EffectBase";

type Args = {
	readonly particle: ParticleEmitter;
	readonly isEnabled: boolean;
	readonly acceleration: Vector3;
	readonly color?: Color3;
};
export class ParticleEffect extends EffectBase<Args> {
	constructor() {
		super("particle_effect");
	}

	justRun({ particle, isEnabled, acceleration, color }: Args): void {
		if (!particle || !particle.Parent) return;

		const part = particle.Parent;
		if (!BlockManager.isActiveBlockPart(part)) return;

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
		if (color) particle.Color = new ColorSequence(color);
	}
}
