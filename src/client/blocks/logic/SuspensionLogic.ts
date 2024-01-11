import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class SuspensionLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.suspensionblock> {
	private springSide: BasePart;
	private springConstraint: SpringConstraint;

	constructor(block: BlockModel) {
		super(block, SuspensionLogic.getConfigDefinition());

		this.springSide = block.FindFirstChild("SpringSide") as BasePart;
		this.springConstraint = this.springSide.FindFirstChild("Spring") as SpringConstraint;
	}

	protected prepare() {
		super.prepare();

		this.springConstraint.Damping = this.input.damping.value.get();
		this.springConstraint.Stiffness = this.input.stiffness.value.get();
		this.springConstraint.FreeLength = this.input.free_length.value.get();
	}

	static getConfigDefinition() {
		return blockConfigRegistry.suspensionblock;
	}
}
