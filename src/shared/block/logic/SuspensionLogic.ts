import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type Suspension = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly Spring: SpringConstraint;
		readonly Beam: Beam;
	};
};
export default class SuspensionLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.suspensionblock,
	Suspension
> {
	private springConstraint: SpringConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.suspensionblock);
		this.springConstraint = this.instance.SpringSide.Spring;

		this.onImpactBreak(() => {
			if (this.instance.SpringSide.FindFirstChild("Beam")) {
				this.instance.SpringSide.Beam.Destroy();
			}

			this.disable();
		});

		this.springConstraint.Damping = this.input.damping.get();
		this.springConstraint.Stiffness = this.input.stiffness.get();
		this.event.subscribeObservable(this.input.free_length, (v) => (this.springConstraint.FreeLength = v), true);
	}
}
