import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

type Suspension = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly Spring: SpringConstraint;
		readonly Beam: Beam;
	};
};
export class SuspensionLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.suspensionblock, Suspension> {
	private readonly springConstraint: SpringConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.suspensionblock);
		this.springConstraint = this.instance.SpringSide.Spring;

		this.springConstraint.Damping = this.input.damping.get();
		this.springConstraint.Stiffness = this.input.stiffness.get();
		this.event.subscribeObservable(this.input.free_length, (v) => (this.springConstraint.FreeLength = v), true);

		this.onDescendantDestroyed(() => {
			block.instance.FindFirstChild("SpringSide")?.FindFirstChild("Beam")?.Destroy();
		});
	}
}
