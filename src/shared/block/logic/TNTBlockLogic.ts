import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	static readonly events = {
		explode: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly radius: number;
			readonly pressure: number;
			readonly isFlammable: boolean;
		}>("tnt_explode", "UnreliableRemoteEvent"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.tnt);

		this.event.subscribe(this.instance.PrimaryPart!.Touched, (part) => {
			if (!this.input.impact.get()) return;

			const velocity1 = this.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				this.explode();
			}
		});

		this.event.subscribeObservable(
			this.input.explode,
			(explode) => {
				if (!explode) return;
				this.explode();
			},
			true,
		);
	}

	private explode() {
		TNTBlockLogic.events.explode.send({
			block: this.instance,
			radius: this.input.radius.get(),
			pressure: this.input.pressure.get(),
			isFlammable: this.input.flammable.get(),
		});

		this.disable();
	}
}
