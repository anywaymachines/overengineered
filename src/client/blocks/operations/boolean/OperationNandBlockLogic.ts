import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationNandBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnand> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationnand);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
	}

	private update() {
		this.output.result.set(!(this.input.value1.value.get() === true && this.input.value2.value.get() === true));
	}
}
