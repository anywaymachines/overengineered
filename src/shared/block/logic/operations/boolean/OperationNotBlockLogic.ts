import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class OperationNotBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationnot> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationnot);
		this.input.value.subscribe((value) => this.output.result.set(!value));
	}
}
