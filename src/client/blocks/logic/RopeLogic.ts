import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class RopeLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.rope> {
	private ropeSide: BasePart;
	private ropeConstraint: RopeConstraint;

	constructor(block: BlockModel) {
		super(block, RopeLogic.getConfigDefinition());

		this.ropeSide = block.FindFirstChild("RopeSide") as BasePart;
		this.ropeConstraint = this.ropeSide.FindFirstChild("RopeConstraint") as RopeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.ropeConstraint.Length = this.input.length.value.get();
	}

	static getConfigDefinition() {
		return blockConfigRegistry.rope;
	}
}
