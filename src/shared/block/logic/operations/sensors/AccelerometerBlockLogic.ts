import { RunService } from "@rbxts/services";
import RobloxUnit from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";

export default class AccelerometerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.accelerometer> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.accelerometer.input>) {
		super(block, blockConfigRegistry.accelerometer);
		this.event.subscribe(RunService.Heartbeat, () => this.update());
	}

	private update() {
		if (!this.block.instance.PrimaryPart) {
			this.disable();
			return;
		}

		const linearVelocity = this.block.instance.PrimaryPart!.AssemblyLinearVelocity;
		this.output.linear.set(
			this.block.instance
				.GetPivot()
				.Rotation.ToObjectSpace(
					new CFrame(
						new Vector3(
							RobloxUnit.Studs_To_Meters(linearVelocity.X),
							RobloxUnit.Studs_To_Meters(linearVelocity.Y),
							RobloxUnit.Studs_To_Meters(linearVelocity.Z),
						),
					),
				).Position,
		);

		const angularVelocity = this.block.instance.PrimaryPart!.AssemblyAngularVelocity;
		this.output.angular.set(
			new Vector3(
				RobloxUnit.Studs_To_Meters(angularVelocity.X),
				RobloxUnit.Studs_To_Meters(angularVelocity.Y),
				RobloxUnit.Studs_To_Meters(angularVelocity.Z),
			),
		);
	}
}
