import {
	BlockConfigBothDefinitions,
	BlockConfigRegToDefinition,
	BlockConfigValueTypeBool,
	BlockConfigValueTypeNumber,
	BlockConfigValueTypeOr,
	BlockConfigValueTypeVector3,
} from "./BlockConfigDefinitionRegistry";

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
			canBeSwitch: false,
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
				thrust: {
					add: "W" as KeyCode,
					sub: "S" as KeyCode,
				},
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

const keysensor = {
	input: {
		key: {
			displayName: "Key",
			type: "keybool",
			connectorHidden: true,
			default: false as boolean,
			config: {
				key: "F" as KeyCode,
				switch: false as boolean,
			},
			canBeSwitch: true,
		},
	},
	output: {
		result: {
			displayName: "Pressed",
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

const twoNumberInputsNumberOutput = {
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

const connectors = {
	boolOrNumberOrVector(
		name: string,
		group?: string,
		additional?: Partial<
			BlockConfigRegToDefinition<
				BlockConfigValueTypeOr<
					[BlockConfigValueTypeBool, BlockConfigValueTypeNumber, BlockConfigValueTypeVector3]
				>
			>
		>,
	): BlockConfigRegToDefinition<
		BlockConfigValueTypeOr<[BlockConfigValueTypeBool, BlockConfigValueTypeNumber, BlockConfigValueTypeVector3]>
	> {
		return {
			displayName: name,
			type: "or",
			default: 0 as number,
			config: 0 as number,
			group,
			types: [
				{
					type: "bool",
					config: false as boolean,
					default: false as boolean,
				},
				{
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
				{
					type: "vector3",
					default: Vector3.zero as Vector3,
					config: Vector3.zero as Vector3,
				},
			],
			...(additional ?? {}),
		};
	},
	boolOrNumber(
		name: string,
		group?: string,
	): BlockConfigRegToDefinition<BlockConfigValueTypeOr<[BlockConfigValueTypeBool, BlockConfigValueTypeNumber]>> {
		return {
			displayName: name,
			type: "or",
			default: 0 as number,
			config: 0 as number,
			group,
			types: [
				{
					type: "bool",
					config: false as boolean,
					default: false as boolean,
				},
				{
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
			],
		};
	},
} as const;

const twoNumbersOrBooleansInputBooleanOutput = {
	input: {
		value1: connectors.boolOrNumber("Value 1", "1"),
		value2: connectors.boolOrNumber("Value 2", "1"),
	},
	output: {
		result: {
			displayName: "Result",
			type: "bool",
			config: false as boolean,
			default: false as boolean,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const screen = {
	input: {
		data: connectors.boolOrNumber("Data", "1"),
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const twoNumbersInputBooleanOutput = {
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
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const operationvec3combiner = {
	input: {
		value_x: {
			displayName: "X",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		value_y: {
			displayName: "Y",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		value_z: {
			displayName: "Z",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {
		result: {
			displayName: "Vector",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const operationvec3splitter = {
	input: {
		value: {
			displayName: "Vector",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
	},
	output: {
		result_x: {
			displayName: "X",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		result_y: {
			displayName: "Y",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		result_z: {
			displayName: "Z",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const anglesensor = {
	input: {},
	output: {
		result: {
			displayName: "Angle",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const altimeter = {
	input: {},
	output: {
		result: {
			displayName: "Height",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const constant = {
	input: {
		//connectors.boolOrNumberOrVector("Value", "1", { connectorHidden: true }),
		value: {
			displayName: "Hidden",
			type: "number",
			default: 0 as number,
			config: 0 as number,
			connectorHidden: true,
		},
	},
	output: {
		//connectors.boolOrNumberOrVector("Value", "1"),
		result: {
			displayName: "Value",
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
	suspensionblock,
	vehicleseat,

	lamp,
	screen,

	multiplexer,

	speedometer,
	anglesensor,
	keysensor,
	altimeter,

	constant,

	operationnot: booleanProcessing,
	operationand: twoBooleanInputsOneBooleanOutput,
	operationnand: twoBooleanInputsOneBooleanOutput,
	operationor: twoBooleanInputsOneBooleanOutput,
	operationxor: twoBooleanInputsOneBooleanOutput,
	operationxnor: twoBooleanInputsOneBooleanOutput,
	operationnor: twoBooleanInputsOneBooleanOutput,

	operationequals: twoNumbersOrBooleansInputBooleanOutput,
	operationgreaterthan: twoNumbersInputBooleanOutput,
	operationround: numberProcessing,

	operationadd: twoNumberInputsNumberOutput,
	operationsub: twoNumberInputsNumberOutput,
	operationmul: twoNumberInputsNumberOutput,
	operationdiv: twoNumberInputsNumberOutput,

	operationrad: numberProcessing,
	operationdeg: numberProcessing,

	operationvec3splitter,
	operationvec3combiner,
} as const satisfies Record<string, BlockConfigBothDefinitions>;

export default blockConfigRegistry;

export type BlockConfigRegistry = Readonly<Record<keyof typeof blockConfigRegistry, BlockConfigBothDefinitions>>;
export type BlockConfigRegistryNonGeneric = Readonly<Record<string, BlockConfigBothDefinitions | undefined>>;
