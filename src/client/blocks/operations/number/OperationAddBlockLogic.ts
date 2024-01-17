import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationAddBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationadd> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationadd);

		this.event.subscribeObservable(this.input.value1, () => this.update());
		this.event.subscribeObservable(this.input.value2, () => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.get() + this.input.value2.get());
	}
}
