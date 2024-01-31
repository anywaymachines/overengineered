import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class Multiplexer extends ConfigurableBlockLogic<typeof blockConfigRegistry.multiplexer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.multiplexer);

		this.input.falsenumber.subscribe(() => this.update());
		this.input.truenumber.subscribe(() => this.update());
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(
			this.input.value.get() === true ? this.input.truenumber.get() : this.input.falsenumber.get(),
		);
	}
}
