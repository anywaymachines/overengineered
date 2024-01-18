import { RunService } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class AngleSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.anglesensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.anglesensor);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		const [x, y, z] = this.block.instance.GetPivot().ToEulerAnglesXYZ();
		this.output.result.set(new Vector3(x, y, z));
	}
}
