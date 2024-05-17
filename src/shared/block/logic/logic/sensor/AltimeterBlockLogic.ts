import { RobloxUnit } from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { GameDefinitions } from "shared/data/GameDefinitions";

export class AltimeterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.altimeter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.altimeter);
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		this.output.result.set(
			RobloxUnit.Studs_To_Meters(this.block.instance.GetPivot().Position.Y + GameDefinitions.HEIGHT_OFFSET),
		);
	}
}
