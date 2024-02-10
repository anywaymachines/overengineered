import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationBufferBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationbuffer
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationbuffer);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value.get());
	}
}
