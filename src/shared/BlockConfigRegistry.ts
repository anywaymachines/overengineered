import { BlockConfigBothDefinitions } from "./BlockConfigDefinitionRegistry";

const disconnectblock = {
	input: {
		disconnect: {
			displayName: "Disconnect key",
			type: "keybool",
			default: false as boolean,
			config: {
				key: "F" as KeyCode,
				switch: false as boolean,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const motorblock = {
	input: {
		rotationSpeed: {
			displayName: "Rotation speed",
			type: "motorRotationSpeed",
			default: 0 as number,
			config: {
				rotate_add: "R" as KeyCode,
				rotate_sub: "F" as KeyCode,
				speed: 15 as number,
				switchmode: false as boolean,
			},
			maxSpeed: 10000 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const smallrocketengine = {
	input: {
		thrust: {
			displayName: "Thrust",
			type: "thrust",
			default: 0 as number,
			config: {
				thrust_add: "W" as KeyCode,
				thrust_sub: "S" as KeyCode,
				switchmode: false as boolean,
				strength: 100 as number,
			},
			canBeSwitch: true as boolean,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const rope = {
	input: {
		length: {
			displayName: "Length",
			type: "clampedNumber",
			min: 2,
			max: 50,
			step: 1,
			default: 15 as number,
			config: 15 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const servomotorblock = {
	input: {
		speed: {
			displayName: "Speed",
			type: "clampedNumber",
			min: 0,
			max: 50,
			step: 1,
			default: 15 as number,
			config: 15 as number,
		},
		angle: {
			displayName: "Target angle",
			type: "servoMotorAngle",
			default: 0 as number,
			config: {
				rotate_add: "R" as KeyCode,
				rotate_sub: "F" as KeyCode,
				switchmode: false as boolean,
				angle: 45 as number,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const tnt = {
	input: {
		explode: {
			displayName: "Explode",
			type: "keybool",
			default: false as boolean as boolean,
			config: {
				key: "B" as KeyCode,
				switch: false as boolean,
			},
			canBeSwitch: false,
		},
		radius: {
			displayName: "Explosion radius",
			type: "clampedNumber",
			default: 12 as number,
			min: 1,
			max: 12,
			step: 1,
			config: 12 as number,
		},
		pressure: {
			displayName: "Explosion pressure",
			type: "clampedNumber",
			default: 2500 as number,
			min: 0,
			max: 2500,
			step: 1,
			config: 2500 as number,
		},
		flammable: {
			displayName: "Flammable",
			type: "bool",
			default: true as boolean,
			config: true as boolean,
		},
		impact: {
			displayName: "Impact",
			type: "bool",
			default: true as boolean,
			config: true as boolean,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const lamp = {
	input: {
		enabled: {
			displayName: "Enabled",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const suspensionblock = {
	input: {
		damping: {
			displayName: "Damping",
			type: "clampedNumber",
			default: 30 as number,
			min: 0,
			max: 100,
			step: 0.01,
			config: 30 as number,
		},
		stiffness: {
			displayName: "Stiffness",
			type: "clampedNumber",
			default: 20 as number,
			min: 0,
			max: 1000,
			step: 0.01,
			config: 20 as number,
		},
		free_length: {
			displayName: "Free Length",
			type: "clampedNumber",
			default: 4.5 as number,
			min: 0,
			max: 10,
			step: 0.01,
			config: 4 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const vehicleseat = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const speedometer = {
	input: {},
	output: {
		result: {
			displayName: "Speed m/s",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const booleanProcessing = {
	input: {
		value: {
			displayName: "Value",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const numberProcessing = {
	input: {
		value: {
			displayName: "Value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const twoNumberInputsOneNumberOutput = {
	input: {
		value1: {
			displayName: "Value 1",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},

		value2: {
			displayName: "Value 2",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const twoBooleanInputsOneBooleanOutput = {
	input: {
		value1: {
			displayName: "Value 1",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},

		value2: {
			displayName: "Value 2",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const multiplexer = {
	input: {
		value: {
			displayName: "Value",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},

		truenumber: {
			displayName: "True number",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},

		falsenumber: {
			displayName: "False number",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const blockConfigRegistry = {
	disconnectblock,
	motorblock,
	smallrocketengine,
	rocketengine: smallrocketengine,
	rope,
	servomotorblock,
	tnt,
	lamp,
	suspensionblock,
	vehicleseat,

	multiplexer,

	speedometer,

	operationnot: booleanProcessing,
	operationand: twoBooleanInputsOneBooleanOutput,
	operationnand: twoBooleanInputsOneBooleanOutput,
	operationor: twoBooleanInputsOneBooleanOutput,
	operationxor: twoBooleanInputsOneBooleanOutput,
	operationxnor: twoBooleanInputsOneBooleanOutput,
	operationnor: twoBooleanInputsOneBooleanOutput,

	operationadd: twoNumberInputsOneNumberOutput,
	operationsub: twoNumberInputsOneNumberOutput,
	operationmul: twoNumberInputsOneNumberOutput,
	operationdiv: twoNumberInputsOneNumberOutput,
} as const satisfies Record<string, BlockConfigBothDefinitions>;

export default blockConfigRegistry;

export type BlockConfigRegistry = Readonly<Record<keyof typeof blockConfigRegistry, BlockConfigBothDefinitions>>;
export type BlockConfigRegistryNonGeneric = Readonly<Record<string, BlockConfigBothDefinitions | undefined>>;
