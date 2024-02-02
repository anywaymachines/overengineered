import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationMulBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationmul> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationmul);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() * this.input.value2.get());
	}
}
