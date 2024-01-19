import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationRoundBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationround
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationround);
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.round(this.input.value.get()));
	}
}
