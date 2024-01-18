import { Workspace } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import SoundController from "client/controller/SoundController";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { UnreliableRemotes } from "shared/Remotes";
import RobloxUnit from "shared/RobloxUnit";
import { PlacedBlockData } from "shared/building/BlockManager";

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
export default class RocketEngineLogic extends ConfigurableBlockLogic<
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

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.smallrocketengine);

		this.event.subscribeObservable(this.input.thrust, (thrust) => (this.thrust = thrust), true);

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
		this.multiplier *= math.max(1, RobloxUnit.GetMaterialPhysicalProperties(block.material).Density / 2);

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
		this.event.subscribeObservable(this.input.thrust, () => this.update(), true);
	}

	private update() {
		const torque = this.thrust;

		// Force
		this.vectorForce.Force = new Vector3((this.power * this.multiplier * torque * -1) / 100, 0, 0);

		// Particles
		const newParticleEmitterState = torque !== 0;
		const newParticleEmitterAcceleration = new Vector3((this.maxParticlesAcceleration / 100) * torque, 0, 0);
		const particleEmmiterHasDifference =
			this.particleEmitter.Enabled !== newParticleEmitterState ||
			math.abs(this.particleEmitter.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

		this.particleEmitter.Enabled = newParticleEmitterState;
		this.particleEmitter.Acceleration = new Vector3((this.maxParticlesAcceleration / 100) * torque, 0, 0);

		// Sound
		const newSoundState = torque !== 0;
		const newVolume = SoundController.getWorldVolume((this.maxSoundVolume / 100) * torque);
		const volumeHasDifference =
			newSoundState !== this.sound.Playing || math.abs(this.sound.Volume - newVolume) > 0.005;
		this.sound.Playing = newSoundState;
		this.sound.Volume = newVolume;

		if (volumeHasDifference) {
			UnreliableRemotes.ReplicateSound.FireServer(this.sound, this.sound.Playing, this.sound.Volume);
		}
		if (particleEmmiterHasDifference) {
			UnreliableRemotes.ReplicateParticle.FireServer(
				this.particleEmitter,
				this.particleEmitter.Enabled,
				this.particleEmitter.Acceleration,
			);
		}
	}

	public getTorque() {
		return this.input.thrust.get();
	}
}
