import { BlockLogicData } from "shared/block/BlockLogic";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";

export default class ConstantBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.constant> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.constant.input>) {
		super(block, blockConfigRegistry.constant);

		this.event.subscribeObservable(this.input.value, (value) => this.output.result.set(value), true);
	}
}
