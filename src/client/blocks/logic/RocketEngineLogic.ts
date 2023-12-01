import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import SmallRocketEngineBlock from "shared/registry/blocks/SmallRocketEngine";

export default class RocketEngineLogic extends ConfigurableBlockLogic<SmallRocketEngineBlock> {
	// Instances
	private readonly engine;
	private readonly vectorForce;
	private readonly particleEmitter;
	private readonly sound;

	// Configuration
	private readonly isSwitchMode;
	private readonly increaseKey;
	private readonly decreaseKey;

	// Math
	private readonly multiplier;

	// hz
	private torque = 0;
	private isIncreasing = false;
	private isDescreasing = false;

	constructor(block: Model) {
		super(block);

		this.increaseKey = this.config.get("thrust_add");
		this.decreaseKey = this.config.get("thrust_sub");
		this.isSwitchMode = this.config.get("switchmode");

		this.engine = block.FindFirstChild("Engine")!;
		this.vectorForce = this.engine.FindFirstChild("VectorForce") as VectorForce;
		this.sound = this.engine.FindFirstChild("Sound") as Sound;
		this.particleEmitter = this.engine.FindFirstChild("Fire") as ParticleEmitter;

		const colbox = block.FindFirstChild("ColBox") as Part;
		this.multiplier = (colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16;
	}

	protected setup() {
		super.setup();

		// Increase events
		this.inputHandler.onKeyDown(this.increaseKey, () => (this.isIncreasing = true));
		this.inputHandler.onKeyUp(this.increaseKey, () => (this.isIncreasing = false));

		// Decrease events
		this.inputHandler.onKeyDown(this.decreaseKey, () => (this.isDescreasing = true));
		this.inputHandler.onKeyUp(this.decreaseKey, () => (this.isDescreasing = false));
	}
}
