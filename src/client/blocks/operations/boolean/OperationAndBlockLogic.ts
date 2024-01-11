import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationAndBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationand> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationand);

		this.event.subscribeObservable(this.input.value1.value, () => this.update());
		this.event.subscribeObservable(this.input.value2.value, () => this.update());
		this.update();
	}

	private update() {
		this.output.result.set(this.input.value1.value.get() === true && this.input.value2.value.get() === true);
	}
}
