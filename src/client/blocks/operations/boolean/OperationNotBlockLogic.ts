import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationNotBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnot> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.operationnot);

		this.event.subscribeObservable(
			this.inputConfig.values.value.value,
			(value) => this.outputConfig.values.result.set(value === false),
			true,
		);
	}
}
