import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class MotorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.motorblock> {
	private readonly hingeConstraint;

	private readonly speed;
	private readonly isSwitch;

	constructor(block: BlockModel) {
		super(block, MotorBlockLogic.getConfigDefinition());

		// Configuration
		this.speed = this.config.get("speed");
		this.isSwitch = this.config.get("switch");

		this.hingeConstraint = block.FindFirstChild("Base")?.FindFirstChild("HingeConstraint") as HingeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.eventHandler.subscribe(UserInputService.InputBegan, () => this.update());
		this.eventHandler.subscribe(UserInputService.InputEnded, () => this.update());
	}

	static getConfigDefinition() {
		return blockConfigRegistry.motorblock;
	}

	private isIncreasing = false;
	private isDecreasing = false;

	public getKeysDefinition(): KeyDefinitions<typeof blockConfigRegistry.motorblock.input> {
		return {
			rotate_add: {
				conflicts: "rotate_sub",
				keyDown: () => {
					this.isIncreasing = true;
				},
				keyUp: () => {
					this.isIncreasing = false;
				},
			},
			rotate_sub: {
				conflicts: "rotate_add",
				keyDown: () => {
					this.isDecreasing = true;
				},
				keyUp: () => {
					this.isDecreasing = false;
				},
			},
		};
	}

	private update() {
		const isMoving = math.abs(this.hingeConstraint.AngularVelocity) === math.abs(this.speed);

		// Switch logic
		if (this.isSwitch) {
			if (this.isIncreasing) {
				// Increase
				if (isMoving) {
					this.hingeConstraint.AngularVelocity = 0;
					return;
				}
				this.hingeConstraint.AngularVelocity = this.speed;
			}

			if (this.isDecreasing) {
				// Decrease
				if (isMoving) {
					this.hingeConstraint.AngularVelocity = 0;
					return;
				}
				this.hingeConstraint.AngularVelocity = -1 * this.speed;
			}

			return;
		}

		// Basic logic
		if (this.isIncreasing && this.isDecreasing) {
			// Reset
			this.hingeConstraint.AngularVelocity = 0;
		} else if (this.isIncreasing) {
			// Increase
			this.hingeConstraint.AngularVelocity = this.speed;
		} else if (this.isDecreasing) {
			// Decrease
			this.hingeConstraint.AngularVelocity = -1 * this.speed;
		} else {
			// Reset
			this.hingeConstraint.AngularVelocity = 0;
		}
	}
}
