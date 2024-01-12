import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type Suspension = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly Spring: SpringConstraint;
	};
};
export default class SuspensionLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.suspensionblock,
	Suspension
> {
	private springConstraint: SpringConstraint;

	constructor(block: PlacedBlockData) {
		super(block, SuspensionLogic.getConfigDefinition());
		this.springConstraint = this.instance.SpringSide.Spring;
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
