import blockConfigRegistry from "shared/BlockConfigRegistry";
import { UnreliableRemotes } from "shared/Remotes";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
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
			UnreliableRemotes.Burn.FireServer(this.instance.PrimaryPart!);
			this.disable();
		}
		this.output.result.set(v1 / v2);
	}
}
