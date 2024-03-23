import RemoteEvents from "shared/RemoteEvents";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationClampBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.operationclamp
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationclamp);

		this.input.value.subscribe(() => this.update());
		this.input.min.subscribe(() => this.update());
		this.input.max.subscribe(() => this.update());
	}

	private update() {
		if (this.input.min.get() > this.input.max.get()) {
			if (this.instance.PrimaryPart) {
				RemoteEvents.Burn.send([this.instance.PrimaryPart]);
			}
			this.disable();
		}
		this.output.result.set(math.clamp(this.input.value.get(), this.input.min.get(), this.input.max.get()));
	}
}
