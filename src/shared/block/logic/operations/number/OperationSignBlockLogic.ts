import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationSignBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationsign> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationsign);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.sign(this.input.value.get()));
	}
}
