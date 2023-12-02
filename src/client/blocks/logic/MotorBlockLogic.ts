import BlockLogic from "client/base/BlockLogic";

export default class MotorBlockLogic extends BlockLogic {
	constructor(block: Model) {
		super(block);

		this.setup();
	}
}
