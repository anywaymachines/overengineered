import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import { RobloxUnit } from "shared/RobloxUnit";
import type { PlacedBlockData } from "shared/building/BlockManager";

type MotorBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};
export class MotorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.motorblock, MotorBlock> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.motorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;

		this.event.subscribeObservable(
			this.input.rotationSpeed,
			(speed) => {
				this.hingeConstraint.AngularVelocity = speed;
			},
			true,
		);

		this.event.subscribeObservable(
			this.input.max_torque,
			(value) => {
				this.hingeConstraint.MotorMaxTorque = RobloxUnit.RowtonStuds_To_NewtonMeters(value * 1_000_000);
			},
			true,
		);

		// Stop on motor corruption
		this.onDescendantDestroyed(() => {
			this.hingeConstraint.AngularVelocity = 0;

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
