import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";

type ServoMotorConfig = {
	readonly rotate_add: "key";
	readonly rotate_sub: "key";
	readonly speed: "number";
	readonly angle: "number";
	readonly switch: "bool";
};

export default class ServoMotorBlockLogic extends ConfigurableBlockLogic<ServoMotorConfig> {
	private readonly hingeConstraint;

	private readonly increaseKey;
	private readonly decreaseKey;
	private readonly speed;
	private readonly angle;
	private readonly isSwitch;

	constructor(block: Model) {
		super(block);

		// Configuration
		this.increaseKey = this.config.get("rotate_add");
		this.decreaseKey = this.config.get("rotate_sub");
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

	public getConfigDefinition(): ConfigTypesToDefinition<ServoMotorConfig> {
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

	private update() {
		const isIncreasing = UserInputService.IsKeyDown(this.increaseKey);
		const isDecreasing = UserInputService.IsKeyDown(this.decreaseKey);
		const isMoving = math.abs(this.hingeConstraint.TargetAngle) === math.abs(this.angle);

		// Switch logic
		if (this.isSwitch) {
			if (isIncreasing) {
				// Increase
				if (isMoving) {
					this.hingeConstraint.TargetAngle = 0;
					return;
				}
				this.hingeConstraint.TargetAngle = this.angle;
			}

			if (isDecreasing) {
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
		if (isIncreasing && isDecreasing) {
			// Reset
			this.hingeConstraint.TargetAngle = 0;
		} else if (isIncreasing) {
			// Increase
			this.hingeConstraint.TargetAngle = this.angle;
		} else if (isDecreasing) {
			// Decrease
			this.hingeConstraint.TargetAngle = -1 * this.angle;
		} else {
			// Reset
			this.hingeConstraint.TargetAngle = 0;
		}
	}
}
