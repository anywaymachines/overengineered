import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationAndBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationand> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationand);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() === true && this.input.value2.get() === true);
	}
}
