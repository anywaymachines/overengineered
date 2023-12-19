import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class SuspensionLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.suspensionblock> {
	private springSide: BasePart;
	private springConstraint: SpringConstraint;

	constructor(block: Model) {
		super(block, SuspensionLogic.getConfigDefinition());

		this.springSide = block.FindFirstChild("SpringSide") as BasePart;
		this.springConstraint = this.springSide.FindFirstChild("Spring") as SpringConstraint;
	}

	protected prepare() {
		super.prepare();

		this.springConstraint.Damping = this.config.get("damping");
		this.springConstraint.Stiffness = this.config.get("stiffness");
		this.springConstraint.FreeLength = this.config.get("free_length");
	}

	static getConfigDefinition() {
		return blockConfigRegistry.suspensionblock;
	}
}
