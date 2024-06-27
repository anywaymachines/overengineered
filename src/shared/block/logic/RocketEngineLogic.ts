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
	private readonly multiplier;
	private readonly power = 30_000;

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

		this.onDescendantDestroyed(() => {
			this.thrust = 0;
			this.update();
			this.disable();
		});

		// Instances
		const effectEmitter = this.instance.EffectEmitter;
		this.engine = this.instance.Engine;
		this.vectorForce = this.engine.VectorForce;
		this.sound = this.engine.Sound;
		this.particleEmitter = effectEmitter.Fire;

		// Math
		const colbox = this.instance.ColBox;
		this.multiplier = (colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16;

		if (this.multiplier !== 1) {
			this.multiplier *= 2;
		}

		// The strength depends on the material
		this.multiplier *= math.max(1, new PhysicalProperties(this.block.material).Density / 2);

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
		this.event.subscribeObservable(
			this.input.thrust,
			(value) => {
				this.thrust = value;
				this.update();
			},
			true,
		);

		// Max power
		this.output.maxpower.set(
			RobloxUnit.Rowton_To_Newton((this.power * this.multiplier * this.input.strength.get()) / 100),
		);
	}

	private update() {
		const torque = this.thrust;

		// Force
		this.vectorForce.Force = new Vector3(
			(((this.power * this.multiplier * torque * -1) / 100) * this.input.strength.get()) / 100,
			0,
			0,
		);

		// Particles
		const newParticleEmitterState = torque !== 0;
		const newParticleEmitterAcceleration = new Vector3(
			((this.maxParticlesAcceleration / 100) * torque * this.input.strength.get()) / 100,
			0,
			0,
		);
		const particleEmmiterHasDifference =
			this.particleEmitter.Enabled !== newParticleEmitterState ||
			math.abs(this.particleEmitter.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

		this.particleEmitter.Enabled = newParticleEmitterState;
		this.particleEmitter.Acceleration = new Vector3(
			((this.maxParticlesAcceleration / 100) * torque * this.input.strength.get()) / 100,
			0,
			0,
		);

		// Sound
		const newSoundState = torque !== 0;
		const newVolume =
			(Sound.getWorldVolume(this.instance.GetPivot().Y) *
				((this.maxSoundVolume / 100) * torque * this.input.strength.get())) /
			100;

		const volumeHasDifference =
			newSoundState !== this.sound.Playing || math.abs(this.sound.Volume - newVolume) > 0.005;
		this.sound.Playing = newSoundState;
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
