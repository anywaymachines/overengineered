import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class Multiplexer extends ConfigurableBlockLogic<typeof blockConfigRegistry.multiplexer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.multiplexer);

		this.input.falsevalue.subscribe(() => this.update());
		this.input.truevalue.subscribe(() => this.update());
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(
			this.input.value.get() === true ? this.input.truevalue.get() : this.input.falsevalue.get(),
		);
	}
}
