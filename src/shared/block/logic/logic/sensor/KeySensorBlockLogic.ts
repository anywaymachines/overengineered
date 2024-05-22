import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class KeySensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.keysensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.keysensor);

		this.event.subscribeObservable(this.input.key, () => this.update());
		this.event.onEnable(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.key.get());
	}
}
