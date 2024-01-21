import { RunService } from "@rbxts/services";
import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";

export default class AltimeterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.altimeter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.altimeter);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		this.output.result.set(RobloxUnit.Studs_To_Meters(this.block.instance.GetPivot().Position.Y));
	}
}
