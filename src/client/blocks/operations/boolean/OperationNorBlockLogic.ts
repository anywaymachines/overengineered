import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationNorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationnor);

		this.event.subscribeObservable(this.input.value1, () => this.update());
		this.event.subscribeObservable(this.input.value2, () => this.update());
	}

	private update() {
		this.output.result.set(!(this.input.value1.get() === true || this.input.value2.get() === true));
	}
}
