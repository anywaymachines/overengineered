import { RunService } from "@rbxts/services";
import { RobloxUnit } from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class AltimeterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.altimeter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.altimeter);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		this.output.result.set(RobloxUnit.Studs_To_Meters(this.block.instance.GetPivot().Position.Y));
	}
}
