import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class RelayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.relay> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.relay);
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		if (this.input.state.get()) this.output.result.set(this.input.value.get());
	}
}
