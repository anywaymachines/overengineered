import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationOrBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationor);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() === true || this.input.value2.get() === true);
	}
}
