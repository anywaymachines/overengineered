import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
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
			this.instance.SpringSide.Beam.Destroy();
			this.disable();
		});

		this.event.subscribeObservable(this.input.damping, (v) => (this.springConstraint.Damping = v), true);
		this.event.subscribeObservable(this.input.stiffness, (v) => (this.springConstraint.Stiffness = v), true);
		this.event.subscribeObservable(this.input.free_length, (v) => (this.springConstraint.FreeLength = v), true);
	}
}
