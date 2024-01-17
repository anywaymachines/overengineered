import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationRadBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationrad> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationrad);

		this.event.subscribeObservable(this.input.value, () => this.update());
	}

	private update() {
		this.output.result.set(math.rad(this.input.value.get()));
	}
}
