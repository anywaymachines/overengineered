import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class OperationVec3CombinerBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationvec3combiner
> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.operationvec3combiner.input>) {
		super(block, blockConfigRegistry.operationvec3combiner);

		this.input.value_x.subscribe(() => this.update());
		this.input.value_y.subscribe(() => this.update());
		this.input.value_z.subscribe(() => this.update());
	}

	private update() {
		const x = this.input.value_x.get();
		const y = this.input.value_y.get();
		const z = this.input.value_z.get();
		this.output.result.set(new Vector3(x, y, z));
	}
}
