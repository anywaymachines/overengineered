import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class ConstantBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.constant> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.constant.input>) {
		super(block, blockConfigRegistry.constant);

		this.event.subscribeObservable(this.input.value, (value) => this.output.result.set(value));
		this.event.onPrepare(() => this.output.result.triggerChanged());
	}
}
