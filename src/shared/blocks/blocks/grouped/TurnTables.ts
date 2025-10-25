import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const hingeDefinition = {
	inputOrder: ["enableLimits", "lowerAngleLimit", "upperAngleLimit", "restitution"],
	input: {
		enableLimits: {
			displayName: "Angles Limited",
			tooltip: "Enable limits",
			types: {
				bool: { config: false },
			},
		},
		lowerAngleLimit: {
			displayName: "Lower Angle",
			types: {
				number: {
					config: -45,
					clamp: {
						min: -180,
						max: 180,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
		upperAngleLimit: {
			displayName: "Upper Angle",
			types: {
				number: {
					config: 45,
					clamp: {
						min: -180,
						max: 180,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
		restitution: {
			displayName: "Restitution",
			types: {
				number: {
					config: 0,
					clamp: {
						min: 0,
						max: 1,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

// I might have yoinked this from the servos :)
const servoDefinition = {
	inputOrder: ["speed", "angle", "stiffness", "max_torque"],
	input: {
		speed: {
			displayName: "Angular Speed",
			tooltip: "Specifies the speed of the servo motor in radians per second.",
			unit: "radians/second",
			types: {
				number: {
					config: 15,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 80,
						step: 0.01,
					},
				},
			},
		},
		angle: {
			displayName: "Target Angle",
			unit: "Degrees",
			types: {
				number: {
					config: 0,
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "instant",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 72,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "R", value: 45 },
								{ key: "F", value: -45 },
							],
						},
					},
				},
			},
		},
		stiffness: {
			displayName: "Responsiveness",
			tooltip: "Specifies the sharpness of the servo motor in reaching the Target Angle.",
			types: {
				number: {
					config: 45,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
		max_torque: {
			displayName: "Max Torque",
			tooltip: "Specifies the maximum torque of the servo motor.",
			types: {
				number: {
					config: 200,
					clamp: {
						showAsSlider: true,
						max: 600,
						min: 0,
						step: 0.1,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

// I might have also yoinked this from the motors ;)
const motorDefinition = {
	inputOrder: ["rotationSpeed", "max_torque"],
	input: {
		rotationSpeed: {
			displayName: "Angular Speed",
			unit: "radians/second",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: -120,
						max: 120,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "instant",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 60,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "R", value: 15 },
								{ key: "F", value: -15 },
							],
						},
					},
				},
			},
		},
		max_torque: {
			displayName: "Max Torque",
			tooltip: "The maximum torque that Motor can apply when trying to reach its desired Angular Speed.",
			unit: "RMU stud²/s²",
			types: {
				number: {
					config: 200,
					clamp: {
						max: 800,
						min: 0,
						showAsSlider: true,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

// shared for both powered & unpowered
type TurnTableBlockModel = BlockModel & {
	Base: UnionOperation & {
		HingeConstraint: HingeConstraint;
	};
	BottomPart: UnionOperation & {
		Attachment: Attachment;
	};
	TopPart: UnionOperation & {
		Part: UnionOperation & {
			Attachment: Attachment;
		};
	};
};

// the base logic thats shared for all turny o' tables
abstract class TurnTableLogic_Base<TDef extends BlockLogicFullBothDefinitions> extends InstanceBlockLogic<
	TDef,
	TurnTableBlockModel
> {
	constructor(def: TDef, block: InstanceBlockLogicArgs) {
		super(def, block);

		// extra logic to break hinges if too much stress is applied
		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		this.onTicc(() => {
			const bottom = this.instance.BottomPart;
			const top = this.instance.TopPart;
			if (!(top && bottom)) {
				this.disableAndBurn();
				return;
			}

			if (top.Position.sub(bottom.Position).Magnitude > 3 * blockScale.Y) {
				RemoteEvents.ImpactBreak.send([bottom]);
				this.disable();
			}
		});
	}
}

class TurnTableHingeLogic extends TurnTableLogic_Base<typeof hingeDefinition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(hingeDefinition, block);

		const hinge = this.instance.Base.HingeConstraint;
		this.on(({ enableLimits, lowerAngleLimit, upperAngleLimit, restitution }) => {
			hinge.LimitsEnabled = enableLimits;
			hinge.LowerAngle = lowerAngleLimit;
			hinge.UpperAngle = upperAngleLimit;
			hinge.Restitution = restitution;
		});
	}
}

class TurnTableServoLogic extends TurnTableLogic_Base<typeof servoDefinition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(servoDefinition, block);

		const hinge = this.instance.Base.HingeConstraint;
		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		this.onk(["angle"], ({ angle }) => {
			hinge.TargetAngle = angle;
		});

		this.onk(["max_torque"], ({ max_torque }) => {
			hinge.ServoMaxTorque = max_torque * 10_000 * math.max(0.9, scale);
		});

		this.onk(["speed"], ({ speed }) => {
			hinge.AngularSpeed = speed;
		});

		this.onk(["stiffness"], ({ stiffness }) => {
			hinge.AngularResponsiveness = stiffness;
		});
	}
}

class TurnTableMotorLogic extends TurnTableLogic_Base<typeof motorDefinition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(motorDefinition, block);

		const hinge = this.instance.Base.HingeConstraint;
		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		this.onk(["max_torque"], ({ max_torque }) => {
			hinge.MotorMaxTorque = max_torque * 10_000 * math.max(0.9, scale);
		});

		this.onk(["rotationSpeed"], ({ rotationSpeed }) => {
			hinge.AngularVelocity = rotationSpeed;
		});

		this.onDisable(() => {
			// this was in the motor so here it is here
			if (this.instance.FindFirstChild("Base")?.FindFirstChild("HingeConstraint")) {
				hinge.AngularVelocity = 0;
			}
		});
	}
}

const defAlias = ["lazy susan", "hole"];
const list: BlockBuildersWithoutIdAndDefaults = {
	turntablehinge: {
		displayName: "Turn Table Hinge",
		description: "A bearing but someone cut a hole in it.",

		logic: { definition: hingeDefinition, ctor: TurnTableHingeLogic },
		search: { partialAliases: [...defAlias, "hinge"] },
	},
	turntableservo: {
		displayName: "Turn Table Servo",
		description: "Like the 'Turn Table Hinge', but now it has opinions and a gym membership.",

		logic: { definition: servoDefinition, ctor: TurnTableServoLogic },
		search: { partialAliases: [...defAlias, "servo"] },
	},
	turntablemotor: {
		displayName: "Turn Table Motor",
		description: "Like the 'Turn Table Hinge', but now it spins me right round, baby, right round",

		logic: { definition: motorDefinition, ctor: TurnTableMotorLogic },
		search: { partialAliases: [...defAlias, "motor"] },
	},
};

export const TurnTables = BlockCreation.arrayFromObject(list);
