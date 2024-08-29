import { Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { PlacedBlockData } from "shared/building/BlockManager";
import type { ParticleEffect } from "shared/effects/ParticleEffect";
import type { SoundEffect } from "shared/effects/SoundEffect";

type RCSEngine = BlockModel & {
	readonly Engine1Emitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine2Emitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine3Emitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine4Emitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine5Emitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine1: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly Engine2: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly Engine3: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly Engine4: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly Engine5: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly ColBox: Part;
};

type singleEngineConfiguration = {
	engine: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	particleEmitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	soundEmitter: Sound;
	vectorForce: VectorForce;
};

@injectable
export class RCSEngineLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.rcsengine, RCSEngine> {
	// Instances

	private engineData: singleEngineConfiguration[] = [
		{
			engine: this.instance.Engine1,
			particleEmitter: this.instance.Engine1Emitter,
			soundEmitter: undefined as unknown as Sound,
			vectorForce: undefined as unknown as VectorForce,
		},
		{
			engine: this.instance.Engine2,
			particleEmitter: this.instance.Engine2Emitter,
			soundEmitter: undefined as unknown as Sound,
			vectorForce: undefined as unknown as VectorForce,
		},
		{
			engine: this.instance.Engine3,
			particleEmitter: this.instance.Engine3Emitter,
			soundEmitter: undefined as unknown as Sound,
			vectorForce: undefined as unknown as VectorForce,
		},
		{
			engine: this.instance.Engine4,
			particleEmitter: this.instance.Engine4Emitter,
			soundEmitter: undefined as unknown as Sound,
			vectorForce: undefined as unknown as VectorForce,
		},
		{
			engine: this.instance.Engine5,
			particleEmitter: this.instance.Engine5Emitter,
			soundEmitter: undefined as unknown as Sound,
			vectorForce: undefined as unknown as VectorForce,
		},
	];

	// Math
	private readonly basePower = RobloxUnit.Newton_To_Rowton(35_000);
	private readonly maxPower;

	// Const
	private readonly maxSoundVolume = 0.5;
	private readonly maxParticlesAcceleration = 120;

	private thrust: Vector3 = Vector3.zero;

	constructor(
		block: PlacedBlockData,
		@inject private readonly soundEffect: SoundEffect,
		@inject private readonly particleEffect: ParticleEffect,
	) {
		super(block, blockConfigRegistry.rcsengine);

		// Instances
		const colbox = this.instance.ColBox;

		for (const d of this.engineData) {
			d.vectorForce = d.engine.VectorForce;
			d.soundEmitter = d.engine.Sound;
		}

		// Math
		let multiplier = math.round((colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16);

		// i dont remember why
		if (multiplier !== 1) multiplier *= 2;

		// The strength depends on the material
		multiplier *= math.max(1, math.round(new PhysicalProperties(this.block.material).Density / 2));

		// Max power
		this.maxPower = this.basePower * multiplier;
		//this.output.maxpower.set(this.maxPower);

		const setEngineThrust = (engine: singleEngineConfiguration, thrustPercentage: number) => {
			if (!engine.particleEmitter.Fire) return;
			// Force
			engine.vectorForce.Force = new Vector3(RobloxUnit.Newton_To_Rowton(this.maxPower * thrustPercentage));

			// Particles
			const visualize = thrustPercentage !== 0;
			const newParticleEmitterAcceleration = new Vector3(this.maxParticlesAcceleration * thrustPercentage, 0, 0);
			const particleEmmiterHasDifference =
				engine.particleEmitter.Fire.Enabled !== visualize ||
				math.abs(engine.particleEmitter.Fire.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

			engine.particleEmitter.Fire.Enabled = visualize;
			engine.particleEmitter.Fire.Acceleration = new Vector3(
				this.maxParticlesAcceleration * thrustPercentage,
				0,
				0,
			);

			// Sound
			const newVolume =
				Sound.getWorldVolume(this.instance.GetPivot().Y) * (this.maxSoundVolume * thrustPercentage);

			const volumeHasDifference =
				visualize !== engine.soundEmitter.Playing || math.abs(engine.soundEmitter.Volume - newVolume) > 0.005;
			engine.soundEmitter.Playing = visualize;
			engine.soundEmitter.Volume = newVolume;

			if (volumeHasDifference) {
				this.soundEffect.send(this.instance.PrimaryPart!, {
					sound: engine.soundEmitter,
					isPlaying: engine.soundEmitter.Playing,
					volume: engine.soundEmitter.Volume / 2,
				});
			}
			if (particleEmmiterHasDifference) {
				this.particleEffect.send(this.instance.PrimaryPart!, {
					particle: engine.particleEmitter?.Fire,
					isEnabled: engine.particleEmitter?.Fire.Enabled,
					acceleration: engine.particleEmitter?.Fire.Acceleration,
					color: this.input.trailColor.get(),
				});
			}
		};

		const update = () => {
			if (!this.isEnabled()) return;
			const thrustPercent = VectorUtils.apply(this.thrust, (v) => math.clamp(v, -100, 100) / 100);
			setEngineThrust(this.engineData[0], math.max(0, thrustPercent.Y));

			setEngineThrust(this.engineData[1], math.abs(math.max(0, thrustPercent.X)));
			setEngineThrust(this.engineData[2], math.abs(math.min(0, thrustPercent.X)));

			setEngineThrust(this.engineData[3], math.abs(math.max(0, thrustPercent.Z)));
			setEngineThrust(this.engineData[4], math.abs(math.min(0, thrustPercent.Z)));
		};

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), update);
		this.event.subscribeObservable(
			this.input.direction,
			(value) => {
				this.thrust = value;
				update();
			},
			true,
		);

		this.input.trailLength.subscribe((v) => {
			const val = new NumberRange(v * 0.15);
			for (const engine of this.engineData) engine.particleEmitter.Fire.Lifetime = val;
		});

		this.input.trailColor.subscribe((v) => {
			const val = new ColorSequence(v);
			for (const engine of this.engineData) engine.particleEmitter.Fire.Color = val;
		});

		this.onDescendantDestroyed(() => {
			update();
			this.disable();
		});
	}
}
