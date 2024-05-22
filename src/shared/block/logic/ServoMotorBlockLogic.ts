import { RunService } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockData } from "shared/building/BlockManager";

type ServoMotor = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};
export class ServoMotorBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.servomotorblock,
	ServoMotor
> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.servomotorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;

		this.block.instance.GetDescendants().forEach((desc) => {
			if (!desc.IsA("BasePart")) return;

			const materialPhysProp = new PhysicalProperties(desc.Material);
			const newPhysProp = new PhysicalProperties(materialPhysProp.Density, materialPhysProp.Friction, 0);
			desc.CustomPhysicalProperties = newPhysProp;
		});

		this.input.stiffness.subscribe((value, prev) => {
			this.hingeConstraint.AngularResponsiveness = value;
		});

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
