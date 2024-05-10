import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class OperationVec3SplitterBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationvec3splitter
> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.operationvec3splitter.input>) {
		super(block, blockConfigRegistry.operationvec3splitter);
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		const vector = this.input.value.get();
		this.output.result_x.set(vector.X);
		this.output.result_y.set(vector.Y);
		this.output.result_z.set(vector.Z);
	}
}
