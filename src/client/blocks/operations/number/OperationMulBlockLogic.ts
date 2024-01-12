import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationMulBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationmul> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationmul);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.value.get() * this.input.value2.value.get());
	}
}
