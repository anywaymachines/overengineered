import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationDegBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationdeg> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationdeg);
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(math.deg(this.input.value.get()));
	}
}
