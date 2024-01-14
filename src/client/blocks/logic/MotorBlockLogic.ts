import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type MotorBlock = BlockModel & {
	readonly Base: {
		readonly HingeConstraint: HingeConstraint;
	};
};
export default class MotorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.motorblock, MotorBlock> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.motorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;
		this.event.subscribeObservable(this.input.rotationSpeed.value, (speed) => {
			this.hingeConstraint.AngularVelocity = speed;
		});
	}
}
