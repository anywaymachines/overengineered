import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationGreaterThanBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationgreaterthan
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationgreaterthan);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		if (this.input.value1.get() === undefined || this.input.value2.get() === undefined) return;
		this.output.result.set(this.input.value1.get() > this.input.value2.get());
	}
}
