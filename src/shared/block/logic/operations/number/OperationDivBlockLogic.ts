import RemoteEvents from "shared/RemoteEvents";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class OperationDivBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationdiv> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.operationdiv);

		this.input.value1.subscribe(() => this.update());
		this.input.value2.subscribe(() => this.update());
	}

	private update() {
		const v1 = this.input.value1.get();
		const v2 = this.input.value2.get();

		if (v2 === 0) {
			if (this.instance.PrimaryPart) {
				RemoteEvents.Burn.send(this.instance.PrimaryPart);
			}

			this.disable();
		}
		this.output.result.set(v1 / v2);
	}
}
