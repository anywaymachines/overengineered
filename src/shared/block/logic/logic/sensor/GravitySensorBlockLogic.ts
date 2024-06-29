import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { Physics } from "shared/Physics";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class GravitySensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.gravitysensor> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.gravitysensor.input>) {
		super(block, blockConfigRegistry.gravitysensor);

		this.onEnable(() => this.update());
	}

	tick(tick: number): void {
		super.tick(tick);
		this.update();
	}

	private update() {
		if (!this.block.instance.PrimaryPart) {
			this.disable();
			return;
		}

		this.output.result.set(
			RobloxUnit.Studs_To_Meters(
				Physics.GetGravityOnHeight(Physics.LocalHeight.fromGlobal(this.block.instance.PrimaryPart.Position.Y)),
			),
		);
	}
}
