import { RobloxUnit } from "shared/RobloxUnit";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class SpeedometerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.speedometer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.speedometer);
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		if (!this.block.instance.PrimaryPart) {
			this.disable();
			return;
		}

		this.output.result.set(
			RobloxUnit.Studs_To_Meters(this.block.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude),
		);
	}
}
