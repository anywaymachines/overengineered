import ConfigurableBlockLogic, { KeyDefinition } from "client/base/ConfigurableBlockLogic";

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
	public getKeysDefinition(): Partial<Record<ExtractKeys<MotorConfig, "key">, KeyDefinition>> {
		return {};
	}
}
