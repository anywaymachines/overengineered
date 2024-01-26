import { RunService } from "@rbxts/services";
import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";

export default class AccelerometerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.accelerometer> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.accelerometer);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		const linearVelocity = this.block.instance.PrimaryPart!.AssemblyLinearVelocity;
		const angularVelocity = this.block.instance.PrimaryPart!.AssemblyAngularVelocity;
		this.output.linear.set(
			this.block.instance
				.GetPivot()
				.Rotation.mul(
					new Vector3(
						RobloxUnit.Studs_To_Meters(linearVelocity.X),
						RobloxUnit.Studs_To_Meters(linearVelocity.Y),
						RobloxUnit.Studs_To_Meters(linearVelocity.Z),
					),
				),
		);
		this.output.angular.set(
			new Vector3(
				RobloxUnit.Studs_To_Meters(angularVelocity.X),
				RobloxUnit.Studs_To_Meters(angularVelocity.Y),
				RobloxUnit.Studs_To_Meters(angularVelocity.Z),
			),
		);
	}
}
