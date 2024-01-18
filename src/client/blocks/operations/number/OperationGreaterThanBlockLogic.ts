import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationGreaterThanBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationgreaterthan
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationgreaterthan);

		this.event.subscribeObservable(this.input.value1, () => this.update());
		this.event.subscribeObservable(this.input.value2, () => this.update());
	}

	private update() {
		if (this.input.value1.get() === undefined || this.input.value2.get() === undefined) return;
		this.output.result.set(this.input.value1.get() > this.input.value2.get());
	}
}
