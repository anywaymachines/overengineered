import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class RopeLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.rope> {
	private ropeSide: BasePart;
	private ropeConstraint: RopeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, RopeLogic.getConfigDefinition());

		this.ropeSide = this.instance.FindFirstChild("RopeSide") as BasePart;
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
