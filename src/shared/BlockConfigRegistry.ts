import { BlockConfigBothDefinitions } from "./BlockConfigDefinitionRegistry";

const disconnectblock = {
	input: {
		disconnect: {
			displayName: "Disconnect key",
			type: "keybool",
			default: false as boolean,
			config: {
				key: "F",
				switch: false,
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
			config: {},
			maxSpeed: 10000 as number,
		},
		/*rotate_add: {
			conflicts: "rotate_sub",
			displayName: "Rotate +",
			type: "key",
			default: {
				Desktop: "R",
				Gamepad: "ButtonR1",
			},
		},
		rotate_sub: {
			conflicts: "rotate_add",
			displayName: "Rotate -",
			type: "key",
			default: {
				Desktop: "F",
				Gamepad: "ButtonL1",
			},
		},
		speed: {
			displayName: "Max. speed",
			type: "clampedNumber",
			min: 0,
			max: 50,
			step: 1,
			default: 15,
			config: {
				value: 0,
			},
		},
		switch: {
			displayName: "Switch",
			type: "bool",
			default: false as boolean,
			config: {
				value: false,
			},
		},*/
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
				keyUp: "W",
				keyDown: "S",
				isSwitch: false as boolean,
			},
			canBeSwitch: true as boolean,
		},
		/*thrust_add: {
			conflicts: "thrust_sub",
			displayName: "Thrust +",
			type: "key",
			default: {
				Desktop: "W",
				Gamepad: "ButtonR2",
			},
		},
		thrust_sub: {
			conflicts: "thrust_add",
			displayName: "Thrust -",
			type: "key",
			default: {
				Desktop: "S",
				Gamepad: "ButtonL2",
			},
		},
		switchmode: {
			displayName: "Toggle Mode",
			type: "bool",
			default: {
				Desktop: false,
				Gamepad: false,
			},
		},
		strength: {
			displayName: "Strength %",
			type: "clampedNumber",
			min: 0,
			max: 100,
			step: 1,
			default: 100,
			config: {
				value: 100 as number,
			},
		},*/
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
		/*rotate_add: {
			conflicts: "rotate_sub",
			displayName: "Rotate +",
			type: "key",
			default: {
				Desktop: "Q",
				Gamepad: "ButtonR2",
			},
		},
		rotate_sub: {
			conflicts: "rotate_add",
			displayName: "Rotate -",
			type: "key",
			default: {
				Desktop: "E",
				Gamepad: "ButtonL2",
			},
		},*/
		speed: {
			displayName: "Max. speed",
			type: "clampedNumber",
			min: 0,
			max: 50,
			step: 1,
			default: 15 as number,
			config: 15 as number,
		},
		angle: {
			displayName: "Target angle",
			type: "clampedNumber",
			min: -180,
			max: 180,
			step: 1,
			default: 0 as number,
			config: 0 as number,
		},
		/*switch: {
			displayName: "Switch",
			type: "bool",
			default: false as boolean,
		},*/
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
				key: "B",
				switch: false,
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
			config: 2500 as number,
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
