import { RunService } from "@rbxts/services";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class AngleSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.anglesensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.anglesensor);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		const [x, y, z] = this.block.instance.GetPivot().Rotation.ToEulerAnglesYXZ();
		this.output.result.set(new Vector3(x, y, z));

		return;
	}
}
