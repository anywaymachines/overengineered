import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import MotorBlock from "shared/registry/blocks/MotorBlock";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class MotorBlockLogic extends ConfigurableBlockLogic<MotorBlock> {
	private readonly hingeConstraint;

	private readonly increaseKey;
	private readonly decreaseKey;
	private readonly speed;
	private readonly isSwitch;

	constructor(block: Model) {
		super(block);

		// Configuration
		this.increaseKey = this.config.get("rotate_add");
		this.decreaseKey = this.config.get("rotate_sub");
		this.speed = this.config.get("speed");
		this.isSwitch = this.config.get("switch");

		this.hingeConstraint = block.FindFirstChild("Base")?.FindFirstChild("HingeConstraint") as HingeConstraint;

		this.setup();
	}

	protected setup(): void {
		super.setup();
	}
}
