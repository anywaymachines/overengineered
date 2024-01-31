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
		super(block, blockConfigRegistry.rope);
		this.ropeConstraint = this.instance.RopeSide.RopeConstraint;

		this.event.subscribeObservable(this.input.length, (v) => (this.ropeConstraint.Length = v), true);
	}
}
