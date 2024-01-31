import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationSubBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationsub> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationsub);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() - this.input.value2.get());
	}
}
