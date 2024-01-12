import { UserInputService } from "@rbxts/services";
import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
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

	private readonly speed;
	private readonly angle;
	private readonly isSwitch;

	constructor(block: PlacedBlockData) {
		super(block, ServoMotorBlockLogic.getConfigDefinition());

		// Configuration
		this.speed = this.input.speed.value.get();
		this.angle = this.input.angle.value.get() * -1;
		this.isSwitch = false; //this.config.switch;
		this.event.subscribeObservable(this.input.angle.value, (targetAngle) => {
			this.hingeConstraint.TargetAngle = targetAngle;
		});

		this.hingeConstraint = this.instance.Base.HingeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.hingeConstraint.AngularSpeed = this.speed;

		this.eventHandler.subscribe(UserInputService.InputBegan, () => this.update());
		this.eventHandler.subscribe(UserInputService.InputEnded, () => this.update());
	}

	static getConfigDefinition() {
		return blockConfigRegistry.servomotorblock;
	}

	private isIncreasing = false;
	private isDecreasing = false;

	public getKeysDefinition(): KeyDefinitions<typeof blockConfigRegistry.servomotorblock.input> {
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
