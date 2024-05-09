import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class AngleSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.anglesensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.anglesensor);
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		const [x, y, z] = this.block.instance.GetPivot().Rotation.ToEulerAnglesYXZ();
		this.output.result.set(new Vector3(x, y, z));

		return;
	}
}
