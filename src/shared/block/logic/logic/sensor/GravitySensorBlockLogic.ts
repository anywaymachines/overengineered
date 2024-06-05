import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";
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

		const gravity = math.max(
			GameEnvironment.EarthGravity -
				(this.block.instance.PrimaryPart.Position.Y - GameDefinitions.HEIGHT_OFFSET) *
					(GameEnvironment.EarthGravity / GameEnvironment.ZeroGravityHeight),
			0,
		);

		this.output.result.set(RobloxUnit.Studs_To_Meters(gravity));
	}
}
