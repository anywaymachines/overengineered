import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationNotBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnot> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationnot);

		this.event.subscribeObservable(
			this.input.value.value,
			(value) => this.output.result.set(value === false),
			true,
		);
	}
}
