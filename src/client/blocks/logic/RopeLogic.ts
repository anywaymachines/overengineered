import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type Rope = BlockModel & {
	readonly RopeSide: BasePart & {
		readonly RopeConstraint: RopeConstraint;
	};
};
export default class RopeLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.rope, Rope> {
	private ropeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, RopeLogic.getConfigDefinition());
		this.ropeConstraint = this.instance.RopeSide.RopeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.ropeConstraint.Length = this.input.length.get();
	}

	static getConfigDefinition() {
		return blockConfigRegistry.rope;
	}
}
