import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationVec3SplitterBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationvec3splitter
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationvec3splitter);

		this.event.subscribeObservable(this.input.value.value, () => this.update());
	}

	private update() {
		const vector = this.input.value.value.get();
		this.output.result_x.set(vector.X);
		this.output.result_y.set(vector.Y);
		this.output.result_z.set(vector.Z);
	}
}
