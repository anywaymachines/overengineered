const disconnectblock = {
	input: {
		disconnect: {
			displayName: "Disconnect key",
			type: "key",
			default: {
				Desktop: "F",
				Gamepad: "ButtonR2",
			},
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const motorblock = {
	input: {
		rotate_add: {
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
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const smallrocketengine = {
	input: {
		thrust_add: {
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
			type: "number",
			min: 0,
			max: 100,
			step: 1,
			default: {
				Desktop: 100,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const rope = {
	input: {
		length: {
			displayName: "Length",
			type: "number",
			min: 2,
			max: 50,
			step: 1,
			default: {
				Desktop: 15,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const servomotorblock = {
	input: {
		rotate_add: {
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
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const tnt = {
	input: {
		explode: {
			blockConfigType: "keyb",
			blockConfigDefault: {
				Desktop: "B",
				Gamepad: "ButtonR2",
			},
			displayName: "Explode",
			type: "bool",
			default: {
				Desktop: false,
			},
		},
		radius: {
			displayName: "Explosion radius",
			type: "number",
			default: {
				Desktop: 12,
			},
			min: 1,
			max: 12,
			step: 1,
		},
		pressure: {
			displayName: "Explosion pressure",
			type: "number",
			default: {
				Desktop: 2500,
			},
			min: 0,
			max: 2500,
			step: 1,
		},
		flammable: {
			displayName: "Flammable",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
		impact: {
			displayName: "Impact",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const lamp = {
	input: {
		enabled: {
			blockConfigType: "bool",
			displayName: "Enabled",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const suspensionblock = {
	input: {
		damping: {
			displayName: "Damping",
			type: "number",
			default: {
				Desktop: 30,
			},
			min: 0,
			max: 100,
			step: 0.01,
		},
		stiffness: {
			displayName: "Stiffness",
			type: "number",
			default: {
				Desktop: 20,
			},
			min: 0,
			max: 1000,
			step: 0.01,
		},
		free_length: {
			displayName: "Free Length",
			type: "number",
			default: {
				Desktop: 4.5,
			},
			min: 0,
			max: 10,
			step: 0.01,
		},
	},
	output: {},
} as const satisfies BlockConfigDefinitions;

const vehicleseat = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

const booleanProcessing = {
	input: {
		value: {
			displayName: "Value",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

const numberProcessing = {
	input: {
		value: {
			displayName: "Value",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

const twoNumberInputsOneNumberOutput = {
	input: {
		value1: {
			displayName: "Value 1",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},

		value2: {
			displayName: "Value 2",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

const twoBooleanInputsOneBooleanOutput = {
	input: {
		value1: {
			displayName: "Value 1",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},

		value2: {
			displayName: "Value 2",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

const multiplexer = {
	input: {
		value: {
			displayName: "Value",
			type: "bool",
			default: {
				Desktop: false as boolean,
			},
		},

		truenumber: {
			displayName: "True number",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},

		falsenumber: {
			displayName: "False number",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			type: "number",
			min: -math.huge, // TODO: WTF
			max: math.huge, // TODO: WTF
			step: 0.001, // TODO: WTF
			default: {
				Desktop: 0 as number,
			},
		},
	},
} as const satisfies BlockConfigDefinitions;

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
} as const satisfies Record<string, BlockConfigDefinitions>;

export default blockConfigRegistry;

export type BlockConfigRegistry = Readonly<Record<keyof typeof blockConfigRegistry, BlockConfigDefinitions>>;
export type BlockConfigRegistryNonGeneric = Readonly<Record<string, BlockConfigDefinitions | undefined>>;
