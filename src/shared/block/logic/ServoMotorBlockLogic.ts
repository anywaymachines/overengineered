import { RunService } from "@rbxts/services";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { UnreliableRemotes } from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";
import ConfigurableBlockLogic from "../ConfigurableBlockLogic";

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
				UnreliableRemotes.ImpactBreak.FireServer(this.block.instance.Base);

				this.disable();
			}
		});
	}
}
