import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationSubBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationsub> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationsub);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
	}

	private update() {
		this.output.result.set(this.input.value1.value.get() - this.input.value2.value.get());
	}
}
