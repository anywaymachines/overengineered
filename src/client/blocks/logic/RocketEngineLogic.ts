import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic, { TypedConfigKeys } from "client/base/ConfigurableBlockLogic";
import SmallRocketEngineBlock from "shared/registry/blocks/SmallRocketEngine";

export default class RocketEngineLogic extends ConfigurableBlockLogic<SmallRocketEngineBlock> {
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
	private isWorking = false;

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
	}

	/*public keyDown(key: "thrust_add" | "thrust_sub") {
		// asdasdads
		print(key);
	}*/

	protected prepare() {
		super.prepare();

		// Increase events
		this.inputHandler.onKeyDown(this.increaseKey, () => {
			if (this.isSwitch) {
				this.torque = 100;
				this.update();
			} else {
				this.loop(this.increaseKey, 1);
			}
		});

		// Decrease events
		this.inputHandler.onKeyDown(this.decreaseKey, () => {
			if (this.isSwitch) {
				this.torque = 0;
				this.update();
			} else {
				this.loop(this.decreaseKey, -1);
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

		// TODO: Send packet to server to replicate particles and sounds to other players
	}

	private loop(keyCode: Enum.KeyCode, p: number) {
		if (this.isWorking) {
			return;
		}

		this.isWorking = true;
		while (UserInputService.IsKeyDown(keyCode)) {
			if (this.torque + p >= 0 && this.torque + p <= 100) {
				this.torque += p;
				this.update();
			}

			wait(0.05);
		}
		this.isWorking = false;
	}

	public getTorque() {
		return this.torque;
	}
}
