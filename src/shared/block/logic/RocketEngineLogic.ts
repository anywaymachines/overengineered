import { Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import type { PlacedBlockData } from "shared/building/BlockManager";
import type { ParticleEffect } from "shared/effects/ParticleEffect";
import type { SoundEffect } from "shared/effects/SoundEffect";

type RocketEngine = BlockModel & {
	readonly EffectEmitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly ColBox: Part;
};
@injectable
export class RocketEngineLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.smallrocketengine,
	RocketEngine
> {
	// Instances
	private readonly engine;
	private readonly vectorForce;
	private readonly particleEmitter;
	private readonly sound;

	// Math
	private readonly basePower = RobloxUnit.Newton_To_Rowton(600_000);
	private readonly maxPower;

	// Const
	private readonly maxSoundVolume = 0.5;
	private readonly maxParticlesAcceleration = 120;

	private thrust = 0;

	constructor(
		block: PlacedBlockData,
		@inject private readonly soundEffect: SoundEffect,
		@inject private readonly particleEffect: ParticleEffect,
	) {
		super(block, blockConfigRegistry.smallrocketengine);

		// Instances
		const colbox = this.instance.ColBox;
		this.engine = this.instance.Engine;
		this.vectorForce = this.engine.VectorForce;
		this.sound = this.engine.Sound;
		this.particleEmitter = this.instance.EffectEmitter.Fire;

		// Math
		let multiplier = math.round((colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16);

		// i dont remember why
		if (multiplier !== 1) {
			multiplier *= 2;
		}

		// The strength depends on the material
		multiplier *= math.max(1, math.round(new PhysicalProperties(this.block.material).Density / 2));

		// Max power
		this.maxPower = this.basePower * multiplier;
		print(this.basePower, multiplier, this.maxPower);
		this.output.maxpower.set(this.maxPower);

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
		this.event.subscribeObservable(
			this.input.thrust,
			(value) => {
				this.thrust = value;
				this.update();
			},
			true,
		);
		this.onDescendantDestroyed(() => {
			this.thrust = 0;
			this.update();
			this.disable();
		});
	}

	private update() {
		const thrustPercent = this.thrust / 100;
		const strengthPercent = this.input.strength.get() / 100;

		// Force
		this.vectorForce.Force = new Vector3(
			RobloxUnit.Newton_To_Rowton(this.maxPower * thrustPercent * strengthPercent),
		);

		// Particles
		const visualize = thrustPercent !== 0;
		const newParticleEmitterAcceleration = new Vector3(
			this.maxParticlesAcceleration * thrustPercent * strengthPercent,
			0,
			0,
		);
		const particleEmmiterHasDifference =
			this.particleEmitter.Enabled !== visualize ||
			math.abs(this.particleEmitter.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

		this.particleEmitter.Enabled = visualize;
		this.particleEmitter.Acceleration = new Vector3(
			this.maxParticlesAcceleration * thrustPercent * strengthPercent,
			0,
			0,
		);

		// Sound
		const newVolume =
			Sound.getWorldVolume(this.instance.GetPivot().Y) * (this.maxSoundVolume * thrustPercent * strengthPercent);

		const volumeHasDifference = visualize !== this.sound.Playing || math.abs(this.sound.Volume - newVolume) > 0.005;
		this.sound.Playing = visualize;
		this.sound.Volume = newVolume;

		if (volumeHasDifference) {
			this.soundEffect.send(this.instance.PrimaryPart!, {
				sound: this.sound,
				isPlaying: this.sound.Playing,
				volume: this.sound.Volume,
			});
		}
		if (particleEmmiterHasDifference) {
			this.particleEffect.send(this.instance.PrimaryPart!, {
				particle: this.particleEmitter,
				isEnabled: this.particleEmitter.Enabled,
				acceleration: this.particleEmitter.Acceleration,
			});
		}
	}

	getTorque() {
		return this.input.thrust.get();
	}
}
