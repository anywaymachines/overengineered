import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationVec3SplitterBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationvec3combiner
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationvec3combiner);

		this.event.subscribeObservable(this.input.value_x.value, () => this.update());
		this.event.subscribeObservable(this.input.value_y.value, () => this.update());
		this.event.subscribeObservable(this.input.value_z.value, () => this.update());
	}

	private update() {
		const x = this.input.value_x.value.get();
		const y = this.input.value_y.value.get();
		const z = this.input.value_z.value.get();
		this.output.result.set(new Vector3(x, y, z));
	}
}
