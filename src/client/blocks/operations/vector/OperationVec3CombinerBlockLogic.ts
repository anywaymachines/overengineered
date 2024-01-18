import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationVec3CombinerBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationvec3combiner
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationvec3combiner);

		this.event.subscribeObservable(this.input.value_x, () => this.update());
		this.event.subscribeObservable(this.input.value_y, () => this.update());
		this.event.subscribeObservable(this.input.value_z, () => this.update());
	}

	private update() {
		const x = this.input.value_x.get();
		const y = this.input.value_y.get();
		const z = this.input.value_z.get();
		this.output.result.set(new Vector3(x, y, z));
	}
}
