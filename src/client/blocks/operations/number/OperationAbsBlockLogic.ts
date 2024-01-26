import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationAbsBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationabs> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationabs);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.abs(this.input.value.get()));
	}
}
