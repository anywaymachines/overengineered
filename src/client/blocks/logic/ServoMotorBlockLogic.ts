import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type ServoMotor = BlockModel & {
	readonly Base: {
		readonly HingeConstraint: HingeConstraint;
	};
};
export default class ServoMotorBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.servomotorblock,
	ServoMotor
> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.servomotorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;

		this.event.subscribeObservable(this.input.speed.value, (speed) => {
			this.hingeConstraint.AngularSpeed = speed;
		});
		this.event.subscribeObservable(this.input.angle.value, (targetAngle) => {
			this.hingeConstraint.TargetAngle = targetAngle;
		});
	}
}
