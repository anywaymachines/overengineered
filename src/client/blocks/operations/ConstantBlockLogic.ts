import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class ConstantBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.constant> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.constant);
		this.input.value.value.autoSet(this.output.result);
	}
}
