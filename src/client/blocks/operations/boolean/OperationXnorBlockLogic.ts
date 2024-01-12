import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationXnorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationxnor> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationxnor);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
	}

	private update() {
		this.output.result.set(!(this.input.value1.value.get() !== this.input.value2.value.get()));
	}
}
