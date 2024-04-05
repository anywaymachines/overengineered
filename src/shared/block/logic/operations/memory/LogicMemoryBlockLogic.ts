import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";

export class LogicMemoryBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.logicmemory> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.logicmemory);

		this.input.set.subscribe(() => this.update());
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		if (this.input.set.get()) {
			this.output.result.set(this.input.value.get());
		}
	}
}
