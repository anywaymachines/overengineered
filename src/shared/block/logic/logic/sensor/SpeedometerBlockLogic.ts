import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class SpeedometerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.speedometer> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.speedometer.input>) {
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
		this.output.angular.set(new Vector3(angularVelocity.X, angularVelocity.Y, angularVelocity.Z));
	}
}
