import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationAddBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationadd> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationadd);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
		this.update();
	}

	private update() {
		this.output.result.set(this.input.value1.value.get() + this.input.value2.value.get());
	}
}
