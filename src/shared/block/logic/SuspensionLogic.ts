import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

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
	static readonly clientEvents = {
		destroy_beam: new AutoC2SRemoteEvent<{
			readonly block: Suspension;
		}>("destroy_beam", "UnreliableRemoteEvent"),
	} as const;

	private readonly springConstraint: SpringConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.suspensionblock);
		this.springConstraint = this.instance.SpringSide.Spring;

		this.springConstraint.Damping = this.input.damping.get();
		this.springConstraint.Stiffness = this.input.stiffness.get();
		this.event.subscribeObservable(this.input.free_length, (v) => (this.springConstraint.FreeLength = v), true);

		this.onDescendantDestroyed(() => {
			SuspensionLogic.clientEvents.destroy_beam.send({
				block: this.instance,
			});
		});
	}
}
