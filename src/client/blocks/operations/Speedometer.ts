import { RunService } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class SpeedometerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.speedometer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.speedometer);

		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		this.output.result.set(
			RobloxUnit.Studs_To_Meters(this.block.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude),
		);
	}
}
