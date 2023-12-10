import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";

type ServoMotorConfig = {
	readonly rotate_add: "key";
	readonly rotate_sub: "key";
	readonly speed: "number";
	readonly angle: "number";
	readonly switch: "bool";
};

export default class ServoMotorBlockLogic extends ConfigurableBlockLogic<ServoMotorConfig> {
	private readonly hingeConstraint;

	private readonly speed;
	private readonly angle;
	private readonly isSwitch;

	constructor(block: Model) {
		super(block, ServoMotorBlockLogic.getConfigDefinition());

		// Configuration
		this.speed = this.config.get("speed");
		this.angle = this.config.get("angle") * -1;
		this.isSwitch = this.config.get("switch");

		this.hingeConstraint = block.FindFirstChild("Base")?.FindFirstChild("HingeConstraint") as HingeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.hingeConstraint.AngularSpeed = this.speed;

		this.eventHandler.subscribe(UserInputService.InputBegan, () => this.update());
		this.eventHandler.subscribe(UserInputService.InputEnded, () => this.update());
	}

	static getConfigDefinition(): ConfigTypesToDefinition<ServoMotorConfig> {
		return {
			rotate_add: {
				displayName: "Rotate +",
				type: "key",
				default: {
					Desktop: "Q",
					Gamepad: "ButtonR2",
				},
			},
			rotate_sub: {
				displayName: "Rotate -",
				type: "key",
				default: {
					Desktop: "E",
					Gamepad: "ButtonL2",
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
			angle: {
				displayName: "Angle",
				type: "number",
				min: -180,
				max: 180,
				step: 1,
				default: {
					Desktop: 45,
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

	public getKeysDefinition(): KeyDefinitions<ServoMotorConfig> {
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
		const isMoving = math.abs(this.hingeConstraint.TargetAngle) === math.abs(this.angle);

		// Switch logic
		if (this.isSwitch) {
			if (this.isIncreasing) {
				// Increase
				if (isMoving) {
					this.hingeConstraint.TargetAngle = 0;
					return;
				}
				this.hingeConstraint.TargetAngle = this.angle;
			}

			if (this.isDecreasing) {
				// Decrease
				if (isMoving) {
					this.hingeConstraint.TargetAngle = 0;
					return;
				}
				this.hingeConstraint.TargetAngle = -1 * this.angle;
			}

			return;
		}

		// Basic logic
		if (this.isIncreasing && this.isDecreasing) {
			// Reset
			this.hingeConstraint.TargetAngle = 0;
		} else if (this.isIncreasing) {
			// Increase
			this.hingeConstraint.TargetAngle = this.angle;
		} else if (this.isDecreasing) {
			// Decrease
			this.hingeConstraint.TargetAngle = -1 * this.angle;
		} else {
			// Reset
			this.hingeConstraint.TargetAngle = 0;
		}
	}
}
