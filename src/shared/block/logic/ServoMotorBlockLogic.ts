import { RunService } from "@rbxts/services";
import RemoteEvents from "shared/RemoteEvents";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";

type ServoMotor = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};
export default class ServoMotorBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.servomotorblock,
	ServoMotor
> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.servomotorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;

		this.hingeConstraint.AngularResponsiveness = this.input.stiffness.get();

		this.event.subscribeObservable(
			this.input.speed,
			(speed) => {
				this.hingeConstraint.AngularSpeed = speed;
			},
			true,
		);
		this.event.subscribeObservable(
			this.input.angle,
			(targetAngle) => {
				this.hingeConstraint.TargetAngle = targetAngle;
			},
			true,
		);

		this.event.subscribe(RunService.Heartbeat, () => {
			if (!this.block.instance.FindFirstChild("Attach")) {
				this.disable();
			}

			if (this.block.instance.Attach.Position.sub(this.block.instance.Base.Position).Magnitude > 3) {
				RemoteEvents.ImpactBreak.send(this.block.instance.Base);

				this.disable();
			}
		});
	}
}
