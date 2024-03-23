import { RunService } from "@rbxts/services";
import RemoteEvents from "shared/RemoteEvents";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

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

		this.input.stiffness.subscribe((value, prev) => {
			this.hingeConstraint.AngularResponsiveness = value;
		}, true);

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

		// Stop on motor corruption
		this.onDescendantDestroyed(() => {
			this.disable();
		});

		this.event.subscribe(RunService.Heartbeat, () => {
			if (this.block.instance.Attach.Position.sub(this.block.instance.Base.Position).Magnitude > 3) {
				RemoteEvents.ImpactBreak.send([this.block.instance.Base]);

				this.disable();
				return;
			}
		});
	}
}
