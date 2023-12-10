import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";

type MotorConfig = {
	readonly rotate_add: "key";
	readonly rotate_sub: "key";
	readonly speed: "number";
	readonly switch: "bool";
};

export default class MotorBlockLogic extends ConfigurableBlockLogic<MotorConfig> {
	private readonly hingeConstraint;

	private readonly increaseKey;
	private readonly decreaseKey;
	private readonly speed;
	private readonly isSwitch;

	constructor(block: Model) {
		super(block, MotorBlockLogic.getConfigDefinition());

		// Configuration
		this.increaseKey = this.config.get("rotate_add");
		this.decreaseKey = this.config.get("rotate_sub");
		this.speed = this.config.get("speed");
		this.isSwitch = this.config.get("switch");

		this.hingeConstraint = block.FindFirstChild("Base")?.FindFirstChild("HingeConstraint") as HingeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.eventHandler.subscribe(UserInputService.InputBegan, () => this.update());
		this.eventHandler.subscribe(UserInputService.InputEnded, () => this.update());
	}

	static getConfigDefinition(): ConfigTypesToDefinition<MotorConfig> {
		return {
			rotate_add: {
				displayName: "Rotate +",
				type: "key",
				default: {
					Desktop: "R",
					Gamepad: "ButtonR1",
				},
			},
			rotate_sub: {
				displayName: "Rotate -",
				type: "key",
				default: {
					Desktop: "F",
					Gamepad: "ButtonL1",
				},
			},
			speed: {
				displayName: "Max. speed",
				type: "number",
				min: 0,
				max: 50,
				step: 1,
				default: {
					Desktop: 15,
				},
			},
			switch: {
				displayName: "Switch",
				type: "bool",
				default: {
					Desktop: false,
				},
			},
		};
	}

	private isIncreasing = false;
	private isDecreasing = false;

	public getKeysDefinition(): KeyDefinitions<MotorConfig> {
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
