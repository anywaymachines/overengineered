import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class AngleSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.anglesensor> {
	private readonly initialRotation;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.anglesensor);

		this.initialRotation = this.block.instance.GetPivot().Rotation;
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		const [x, y, z] = this.initialRotation
			.ToObjectSpace(this.block.instance.GetPivot().Rotation)
			.ToEulerAnglesYXZ();
		this.output.result.set(new Vector3(x, y, z));

		return;
	}
}
