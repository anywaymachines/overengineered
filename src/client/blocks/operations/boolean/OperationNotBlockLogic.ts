import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationNotBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnot> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationnot);
		this.input.value.subscribe((value) => this.output.result.set(!value));
	}
}
