import { Workspace } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinition } from "client/base/ConfigurableBlockLogic";
import SoundController from "client/controller/SoundController";

type RocketEngineConfig = {
	readonly thrust_add: "key";
	readonly thrust_sub: "key";
	readonly switchmode: "bool";
	readonly strength: "number";
};

export default class RocketEngineLogic extends ConfigurableBlockLogic<RocketEngineConfig> {
	// Instances
	private readonly engine;
	private readonly vectorForce;
	private readonly particleEmitter;
	private readonly sound;

	// Configuration
	private readonly isSwitch;
	private readonly increaseKey;
	private readonly decreaseKey;
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
		super(block);

		// Configuration
		this.increaseKey = this.config.get("thrust_add");
		this.decreaseKey = this.config.get("thrust_sub");
		this.isSwitch = this.config.get("switchmode");
		this.strength = this.config.get("strength");

		// Instances
		const effectEmitter = block.FindFirstChild("EffectEmitter") as Part;
		this.engine = block.FindFirstChild("Engine")!;
		this.vectorForce = this.engine.FindFirstChild("VectorForce") as VectorForce;
		this.sound = this.engine.FindFirstChild("Sound") as Sound;
		this.particleEmitter = effectEmitter.FindFirstChild("Fire") as ParticleEmitter;

		// Math
		const colbox = block.FindFirstChild("ColBox") as Part;
		this.multiplier = (colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16;

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
	}

	public getConfigDefinition(): ConfigTypesToDefinition<RocketEngineConfig> {
		return {
			thrust_add: {
				displayName: "Thrust +",
				type: "key",
				default: {
					Desktop: "W",
					Gamepad: "ButtonR2",
				},
			},
			thrust_sub: {
				displayName: "Thrust -",
				type: "key",
				default: {
					Desktop: "S",
					Gamepad: "ButtonL2",
				},
			},
			switchmode: {
				displayName: "Switch Mode",
				type: "bool",
				default: {
					Desktop: false,
					Gamepad: false,
				},
			},
			strength: {
				displayName: "Strength %",
				type: "number",
				min: 0,
				max: 100,
				step: 1,
				default: {
					Desktop: 100,
				},
			},
		};
	}
	public getKeysDefinition(): Partial<Record<ExtractKeys<RocketEngineConfig, "key">, KeyDefinition>> {
		return {
			thrust_add: {
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
				if (this.movingUp && this.movingDown) {
					wait(0.05);
					continue;
				}

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
		this.particleEmitter.Enabled = this.torque !== 0;
		this.particleEmitter.Acceleration = new Vector3(
			(this.maxParticlesAcceleration / 100) * this.torque * (this.strength / 100),
			0,
			0,
		);

		// Sound
		this.sound.Playing = this.torque !== 0;
		this.sound.Volume = (this.maxSoundVolume / 100) * this.torque * (this.strength / 100);
		SoundController.applyPropagationPhysics(this.sound);

		// TODO: Send packet to server to replicate particles and sounds to other players
	}

	public getTorque() {
		return this.torque;
	}
}
