import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationOrBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnor> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationor);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
		this.update();
	}

	private update() {
		this.output.result.set(this.input.value1.value.get() === true || this.input.value2.value.get() === true);
	}
}
