import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationXorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationxor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationxor);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() !== this.input.value2.get());
	}
}
