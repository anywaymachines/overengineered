import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class KeySensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.keysensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.keysensor);
		this.input.key.value.autoSet(this.output.result);
	}
}
