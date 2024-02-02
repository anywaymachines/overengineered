import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationXnorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationxnor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationxnor);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(!(this.input.value1.get() !== this.input.value2.get()));
	}
}
