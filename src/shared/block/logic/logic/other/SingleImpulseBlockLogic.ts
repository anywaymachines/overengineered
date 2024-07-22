import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class SingleImpulseBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.singleimpulse> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.singleimpulse);

		this.input.impulse.subscribe(() => {
			if (this.input.impulse.get()) {
				this.output.value.set(true);
			}
		});
	}

	tick(tick: number): void {
		super.tick(tick);
		this.output.value.set(false);
	}
}
