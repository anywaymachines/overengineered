import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class KeySensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.keysensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.keysensor);

		this.event.subscribeObservable(this.input.key, () => this.update());
		this.event.onPrepare(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.key.get());
	}
}
