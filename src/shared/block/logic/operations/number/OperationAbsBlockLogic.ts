import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class OperationAbsBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationabs> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationabs);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.abs(this.input.value.get()));
	}
}
