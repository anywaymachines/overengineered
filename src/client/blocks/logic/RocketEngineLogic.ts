import { Workspace } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import SoundController from "client/controller/SoundController";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { UnreliableRemotes } from "shared/Remotes";
import RobloxUnit from "shared/RobloxUnit";

export default class RocketEngineLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.smallrocketengine> {
	// Instances
	private readonly engine;
	private readonly vectorForce;
	private readonly particleEmitter;
	private readonly sound;

	// Configuration
	private readonly isSwitch;
	private readonly strength;

	// Math
	private readonly multiplier;
	private readonly power = 30_000;

	// Const
	private readonly maxSoundVolume = 0.5;
	private readonly maxParticlesAcceleration = 120;

	// hz
	private torque = 0;
	private movingUp = false;
	private movingDown = false;

	constructor(block: Model) {
		super(block, blockConfigRegistry.smallrocketengine);

		this.onDescendantDestroyed(() => {
			this.torque = 0;
			this.movingUp = false;
			this.movingDown = false;
			this.update();
			this.disable();
		});

		// Configuration
		this.isSwitch = this.config.get("switchmode");
		this.strength = this.config.get("strength");

		// Instances
		const effectEmitter = block.WaitForChild("EffectEmitter") as Part;
		this.engine = block.WaitForChild("Engine")!;
		this.vectorForce = this.engine.WaitForChild("VectorForce") as VectorForce;
		this.sound = this.engine.WaitForChild("Sound") as Sound;
		this.particleEmitter = effectEmitter.WaitForChild("Fire") as ParticleEmitter;

		// Math
		const colbox = block.WaitForChild("ColBox") as Part;
		this.multiplier = (colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16;

		if (this.multiplier !== 1) {
			this.multiplier *= 2;
		}

		// The strength depends on the material
		const material =
			Enum.Material.GetEnumItems().find((value) => value.Value === (block.GetAttribute("material") as number)) ??
			Enum.Material.Plastic;
		this.multiplier *= math.max(1, RobloxUnit.GetMaterialPhysicalProperties(material).Density);

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
	}

	public getKeysDefinition(): KeyDefinitions<typeof blockConfigRegistry.smallrocketengine> {
		return {
			thrust_add: {
				conflicts: "thrust_sub",
				keyDown: () => {
					if (this.movingUp) return;

					if (this.isSwitch) {
						this.torque = 100;
						this.update();
					} else {
						this.movingUp = true;
						this.start(true);
					}
				},
				keyUp: () => {
					this.movingUp = false;
				},
			},
			thrust_sub: {
				conflicts: "thrust_add",
				keyDown: () => {
					if (this.movingDown) return;

					if (this.isSwitch) {
						this.torque = 0;
						this.update();
					} else {
						this.movingDown = true;
						this.start(false);
					}
				},
				keyUp: () => {
					this.movingDown = false;
				},
			},
		};
	}

	private start(up: boolean) {
		spawn(() => {
			while (up ? this.movingUp : this.movingDown) {
				/*if (this.movingUp && this.movingDown) {
					wait(0.05);
					continue;
				}*/

				const p = up ? 1 : -1;
				if (this.torque + p >= 0 && this.torque + p <= 100) {
					this.torque += p;
					this.update();
				}

				wait(0.05);
			}
		});
	}

	private update() {
		// Force
		this.vectorForce.Force = new Vector3(
			((this.power * this.multiplier * this.torque * -1) / 100) * (this.strength / 100),
			0,
			0,
		);

		// Particles
		const newParticleEmitterState = this.torque !== 0;
		const newParticleEmitterAcceleration = new Vector3(
			(this.maxParticlesAcceleration / 100) * this.torque * (this.strength / 100),
			0,
			0,
		);
		const particleEmmiterHasDifference =
			this.particleEmitter.Enabled !== newParticleEmitterState ||
			math.abs(this.particleEmitter.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

		this.particleEmitter.Enabled = newParticleEmitterState;
		this.particleEmitter.Acceleration = new Vector3(
			(this.maxParticlesAcceleration / 100) * this.torque * (this.strength / 100),
			0,
			0,
		);

		// Sound
		const newSoundState = this.torque !== 0;
		const newVolume = SoundController.getWorldVolume(
			(this.maxSoundVolume / 100) * this.torque * (this.strength / 100),
		);
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
		return this.torque;
	}
}
