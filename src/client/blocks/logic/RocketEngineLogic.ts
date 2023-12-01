import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import SmallRocketEngineBlock from "shared/registry/blocks/SmallRocketEngine";

export default class RocketEngineLogic extends ConfigurableBlockLogic<SmallRocketEngineBlock> {
	private torque = 0;

	// Configuration
	private readonly isSwitchMode;
	private readonly increaseKey;
	private readonly decreaseKey;

	constructor(block: Model) {
		super(block);

		this.increaseKey = this.config.get("thrust_add");
		this.decreaseKey = this.config.get("thrust_sub");
		this.isSwitchMode = this.config.get("switchmode");
		print(this.increaseKey);

		this.setup();
		//this.inputHandler.onKeyPressed(Enum.KeyCode.X, () => this.keyPressed(Enum.KeyCode.X));
	}

	protected setup() {
		super.setup();
	}
}
