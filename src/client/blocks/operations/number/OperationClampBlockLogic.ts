import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationClampBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationclamp
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationclamp);

		this.input.value.subscribe(() => this.update());
		this.input.min.subscribe(() => this.update());
		this.input.max.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.clamp(this.input.value.get(), this.input.min.get(), this.input.max.get()));
	}
}
