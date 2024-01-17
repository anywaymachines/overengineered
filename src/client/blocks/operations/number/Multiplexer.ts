import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class Multiplexer extends ConfigurableBlockLogic<typeof blockConfigRegistry.multiplexer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.multiplexer);

		this.event.subscribeObservable(this.input.falsenumber, () => this.update());
		this.event.subscribeObservable(this.input.truenumber, () => this.update());
		this.event.subscribeObservable(this.input.value, () => this.update());
	}

	private update() {
		this.output.result.set(
			this.input.value.get() === true ? this.input.truenumber.get() : this.input.falsenumber.get(),
		);
	}
}
