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
	}

	tick(tick: number): void {
		super.tick(tick);

		const base = this.block.instance.FindFirstChild("Base") as BasePart | undefined;
		const attach = this.block.instance.FindFirstChild("Attach") as BasePart | undefined;
		if (!attach || !base) {
			this.disable();
			return;
		}

		if (attach.Position.sub(base.Position).Magnitude > 3) {
			RemoteEvents.ImpactBreak.send([base]);

			this.disable();
		}
	}
}
