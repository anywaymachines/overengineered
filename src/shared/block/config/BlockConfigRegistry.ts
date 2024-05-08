import { BlockId } from "shared/BlockDataRegistry";

const connectors = {
	boolOrNumberOrVector(
		name: string,
		group?: string,
		additional?: Partial<
			ConfigTypeToDefinition<
				BlockConfigTypes.Or<[BlockConfigTypes.Bool, BlockConfigTypes.Number, BlockConfigTypes.Vec3]>
			>
		>,
	): ConfigTypeToDefinition<
		BlockConfigTypes.Or<[BlockConfigTypes.Bool, BlockConfigTypes.Number, BlockConfigTypes.Vec3]>
	> {
		return {
			displayName: name,
			type: "or",
			default: 0 as number,
			config: {
				type: "unset",
				value: 0,
			},
			group,
			types: {
				bool: {
					displayName: "Boolean",
					type: "bool",
					config: false as boolean,
					default: false as boolean,
				},
				number: {
					displayName: "Number",
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
				vector3: {
					displayName: "Vector3",
					type: "vector3",
					default: Vector3.zero as Vector3,
					config: Vector3.zero as Vector3,
				},
			},
			...(additional ?? {}),
		};
	},
	boolOrNumber(
		name: string,
		group?: string,
	): ConfigTypeToDefinition<BlockConfigTypes.Or<[BlockConfigTypes.Bool, BlockConfigTypes.Number]>> {
		return {
			displayName: name,
			type: "or",
			default: 0 as number,
			config: {
				type: "unset",
				value: 0,
			},
			group,
			types: {
				bool: {
					displayName: "Boolean",
					type: "bool",
					config: false as boolean,
					default: false as boolean,
				},
				number: {
					displayName: "Number",
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
			},
		};
	},
	any(
		name: string,
		group?: string,
	): ConfigTypeToDefinition<
		BlockConfigTypes.Or<
			[BlockConfigTypes.Bool, BlockConfigTypes.Number, BlockConfigTypes.Vec3, BlockConfigTypes.String]
		>
	> {
		return {
			displayName: name,
			type: "or",
			default: 0 as number,
			config: {
				type: "unset",
				value: 0,
			},
			group,
			types: {
				bool: {
					displayName: "Boolean",
					type: "bool",
					config: false as boolean,
					default: false as boolean,
				},
				number: {
					displayName: "Number",
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
				vector3: {
					displayName: "Vector",
					type: "vector3",
					default: Vector3.zero,
					config: Vector3.zero,
				},
				string: {
					displayName: "String",
					type: "string",
					default: "" as string,
					config: "" as string,
				},
			},
		};
	},
} as const;

const disconnectblock = {
	input: {
		disconnect: {
			displayName: "Disconnect key",
			type: "keybool",
			default: false as boolean,
			config: {
				key: "F" as KeyCode,
				switch: false as boolean,
				touchName: "Disconnect" as string,
				reversed: false as boolean,
			},
			canBeSwitch: false,
			canBeReversed: false,
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
				rotation: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				speed: 15 as number,
				switchmode: false as boolean,
			},
			maxSpeed: 50 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const rocketengine = {
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
			},
			canBeSwitch: true as boolean,
		},
		strength: {
			displayName: "Strength",
			type: "clampedNumber",
			min: 0,
			max: 100,
			step: 0.01,
			default: 100 as number,
			config: 100 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const piston = {
	input: {
		extend: {
			displayName: "Extend",
			type: "thrust",
			default: 0 as number,
			config: {
				thrust: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				switchmode: true as boolean,
			},
			canBeSwitch: true as boolean,
		},

		speed: {
			displayName: "Speed",
			type: "clampedNumber",
			min: 0,
			max: 10,
			step: 0.01,
			default: 4 as number,
			config: 4 as number,
			connectorHidden: true,
		},

		maxforce: {
			displayName: "Max Force",
			type: "clampedNumber",
			min: 0,
			max: 2000,
			step: 0.01,
			default: 500 as number,
			config: 500 as number,
			connectorHidden: true,
		},

		distance: {
			displayName: "Distance",
			type: "clampedNumber",
			min: 0,
			max: 8,
			step: 0.01,
			default: 1 as number,
			config: 1 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const ballast = {
	input: {
		density: {
			displayName: "Density",
			type: "controllableNumber",
			min: 0.15,
			max: 10,
			step: 0.01,
			default: 0.15 as number,
			config: {
				value: 0.15 as number,
				control: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
			},
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const heliumblock = {
	input: {
		density: {
			displayName: "Density",
			type: "clampedNumber",
			default: 1 as number,
			config: 1 as number,
			min: 0.55,
			max: 2,
			step: 0.01,
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
			step: 0.01,
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
			step: 0.01,
			default: 15 as number,
			config: 15 as number,
		},
		angle: {
			displayName: "Target angle",
			type: "servoMotorAngle",
			default: 0 as number,
			config: {
				rotation: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				switchmode: false as boolean,
				angle: 45 as number,
			},
		},
		stiffness: {
			displayName: "Stiffness",
			type: "clampedNumber",
			min: 0,
			max: 100,
			step: 0.01,
			default: 45 as number,
			config: 45 as number,
			connectorHidden: true,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const magnet = {
	input: {
		strength: {
			displayName: "Strength",
			type: "clampedNumber",
			min: 0,
			max: 100,
			step: 0.01,
			default: 100 as number,
			config: 100 as number,
		},
		invertPolarity: {
			displayName: "Invert polarity",
			type: "keybool",
			default: false as boolean,
			config: {
				key: "G" as KeyCode,
				switch: false as boolean,
				touchName: "Invert polarity" as string,
				reversed: false as boolean,
			},
			canBeSwitch: true,
			canBeReversed: true,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const tnt = {
	input: {
		explode: {
			displayName: "Explode",
			type: "keybool",
			default: false as boolean,
			config: {
				key: "B" as KeyCode,
				switch: false as boolean,
				touchName: "Explode" as string,
				reversed: false as boolean,
			},
			canBeSwitch: false,
			canBeReversed: false,
		},
		radius: {
			displayName: "Explosion radius",
			type: "clampedNumber",
			default: 12 as number,
			min: 1,
			max: 12,
			step: 0.01,
			config: 12 as number,
		},
		pressure: {
			displayName: "Explosion pressure",
			type: "clampedNumber",
			default: 2500 as number,
			min: 0,
			max: 2500,
			step: 0.01,
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

const leddisplay = {
	input: {
		posx: {
			displayName: "Pos X",
			type: "clampedNumber",
			default: 0 as number,
			config: 0 as number,
			configHidden: true,
			min: 0,
			max: 7,
			step: 1,
		},
		posy: {
			displayName: "Pos Y",
			type: "clampedNumber",
			default: 0 as number,
			config: 0 as number,
			configHidden: true,
			min: 0,
			max: 7,
			step: 1,
		},
		color: {
			displayName: "Color",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
			configHidden: true,
		},
		update: {
			displayName: "Update",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const sevensegmentdisplay = {
	input: {
		value: {
			displayName: "Value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const suspensionblock = {
	input: {
		damping: {
			displayName: "Damping",
			type: "clampedNumber",
			default: 250 as number,
			min: 0,
			max: 10_000,
			step: 0.01,
			config: 250 as number,
			connectorHidden: true,
		},
		stiffness: {
			displayName: "Stiffness",
			type: "clampedNumber",
			default: 75_000 as number,
			min: 0,
			max: 100_000,
			step: 0.01,
			config: 75_000 as number,
			connectorHidden: true,
		},
		free_length: {
			displayName: "Free Length",
			type: "clampedNumber",
			default: 4.5 as number,
			min: 1,
			max: 10,
			step: 0.01,
			config: 4.5 as number,
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

const lidarsensor = {
	input: {
		max_distance: {
			displayName: "Max distance",
			type: "number",
			default: 100 as number,
			config: 100 as number,
		},
	},
	output: {
		distance: {
			displayName: "Distance",
			type: "number",
			default: 0 as number,
			config: 0 as number,
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
				touchName: "Key" as string,
				reversed: false,
			},
			canBeSwitch: true,
			canBeReversed: true,
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

const relay = {
	input: {
		value: connectors.any("Value", "1"),

		state: {
			displayName: "State",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
	output: {
		result: connectors.any("Output", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const wing = {
	input: {
		enabled: {
			displayName: "Enabled",
			type: "bool",
			default: true as boolean,
			config: true as boolean,
			connectorHidden: true,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

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

const anyProcessing = {
	input: {
		value: connectors.any("Value", "1"),
	},
	output: {
		result: connectors.any("Result", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const screen = {
	input: {
		data: connectors.any("Data", "1"),
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const laser = {
	input: {
		maxDistance: {
			displayName: "Max distance",
			type: "clampedNumber",
			config: 200 as number,
			default: 200 as number,
			min: 0.1,
			max: 200,
			step: 0.1,
		},
		alwaysEnabled: {
			displayName: "Always enabled",
			type: "bool",
			config: false as boolean,
			default: false as boolean,
		},
		rayTransparency: {
			displayName: "Ray transparency",
			type: "clampedNumber",
			config: 0 as number,
			default: 0 as number,
			min: 0,
			max: 1,
			step: 0.01,
		},
		dotTransparency: {
			displayName: "Dot transparency",
			type: "clampedNumber",
			config: 0 as number,
			default: 0 as number,
			min: 0,
			max: 1,
			step: 0.01,
		},
		dotSize: {
			displayName: "Dot size",
			type: "clampedNumber",
			config: 0.3 as number,
			default: 0.3 as number,
			min: 0.1,
			max: 2,
			step: 0.01,
		},
		rayColor: {
			displayName: "Ray color",
			type: "color",
			config: Color3.fromRGB(255, 0, 0),
			default: Color3.fromRGB(255, 0, 0),
		},
		dotColor: {
			displayName: "Dot color",
			type: "color",
			config: Color3.fromRGB(255, 255, 0),
			default: Color3.fromRGB(255, 255, 0),
		},
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

const accelerometer = {
	input: {},
	output: {
		linear: {
			displayName: "Linear",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
		angular: {
			displayName: "Angular",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const ownerlocator = {
	input: {},
	output: {
		linear: {
			displayName: "Offset",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
		angular: {
			displayName: "Angular offset",
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

const logicmemory = {
	input: {
		set: {
			displayName: "Set",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		value: connectors.any("Value", "1"),
	},
	output: {
		result: connectors.any("Result", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const stackmemory = {
	input: {
		push: {
			displayName: "Push",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		pop: {
			displayName: "Pop",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		value: connectors.any("Input", "1"),
	},
	output: {
		size: {
			displayName: "Size",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		result: connectors.any("Output", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const randomaccessmemory = {
	input: {
		read: {
			displayName: "Read",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		write: {
			displayName: "Write",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		enabled: {
			displayName: "Enable",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
		address: {
			displayName: "Address",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		value: connectors.any("Input", "1"),
	},
	output: {
		size: {
			displayName: "Size",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		result: connectors.any("Output", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const readonlymemory = {
	input: {
		read: {
			displayName: "Read",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		address: {
			displayName: "Address",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		data: {
			displayName: "Byte Array",
			type: "bytearray",
			config: [],
			default: [],
			lengthLimit: 4096,
			connectorHidden: true,
		},
	},
	output: {
		size: {
			displayName: "Size",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		output1: {
			displayName: "Output 1",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		output2: {
			displayName: "Output 2",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		output3: {
			displayName: "Output 3",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		output4: {
			displayName: "Output 4",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const counter = {
	input: {
		value: {
			displayName: "New value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
			configHidden: true,
		},
		triggerStep: {
			displayName: "Step",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			configHidden: true,
		},
		step: {
			displayName: "Step value",
			type: "number",
			default: 1 as number,
			config: 1 as number,
		},
	},
	output: {
		value: {
			displayName: "Output",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const radiotransmitter = {
	input: {
		value: connectors.any("Input", "1"),
		frequency: {
			displayName: "Frequency",
			type: "clampedNumber",
			default: 868 as number,
			config: 868 as number,
			min: 434,
			max: 1500,
			step: 0.1,
		},
	},
	output: {},
} as const satisfies BlockConfigBothDefinitions;

const radioreciever = {
	input: {
		frequency: {
			displayName: "Frequency",
			type: "clampedNumber",
			default: 868 as number,
			config: 868 as number,
			min: 434,
			max: 1500,
			step: 0.1,
		},
	},
	output: {
		value: connectors.any("Output", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const radarsection = {
	input: {
		maxDistance: {
			displayName: "Max distance",
			type: "clampedNumber",
			default: 100 as number,
			config: 100 as number,
			min: 1,
			max: 5000,
			step: 1,
		},
		detectionSize: {
			displayName: "Detection Size",
			type: "clampedNumber",
			default: 2.2 as number,
			config: 2.2 as number,
			min: 1,
			max: 3,
			step: 0.1,
		},
		visibility: {
			displayName: "Area Visibility",
			type: "bool",
			default: false as boolean,
			config: false as boolean,
		},
	},
	output: {
		distance: {
			displayName: "Distance",
			type: "number",
			default: -1 as number,
			config: -1 as number,
		},
	},
} as const satisfies BlockConfigBothDefinitions;

const delayBlock = {
	input: {
		value: connectors.any("Value", "1"),
		duration: {
			displayName: "Duration",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
	},
	output: {
		result: connectors.any("Result", "1"),
	},
} as const satisfies BlockConfigBothDefinitions;

const operationclamp = {
	input: {
		value: {
			displayName: "Value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		min: {
			displayName: "Min",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},
		max: {
			displayName: "Max",
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

const constant = {
	input: {
		value: connectors.boolOrNumberOrVector("Value", "1", { connectorHidden: true }),
		/*value: {
			displayName: "Value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
			connectorHidden: true,
		},*/
	},
	output: {
		result: connectors.boolOrNumberOrVector("Value", "1"),
		/*result: {
			displayName: "Value",
			type: "number",
			default: 0 as number,
			config: 0 as number,
		},*/
	},
} as const satisfies BlockConfigBothDefinitions;

export const blockConfigRegistry = {
	disconnectblock,
	motorblock,
	smallrocketengine: rocketengine,
	rocketengine: rocketengine,
	rope,
	servomotorblock,
	tnt,
	cylindricaltnt: tnt,
	sphericaltnt: tnt,
	suspensionblock,
	vehicleseat,
	passengerseat: vehicleseat,
	magnet,
	piston,
	ballast,
	heliumblock,

	wing1x1: wing,
	wing1x2: wing,
	wing1x3: wing,
	wing1x4: wing,
	wedgewing1x1: wing,
	wedgewing1x2: wing,
	wedgewing1x3: wing,
	wedgewing1x4: wing,
	lamp,
	leddisplay,
	sevensegmentdisplay,
	screen,
	laser,

	multiplexer,
	relay,

	ownerlocator,
	speedometer,
	anglesensor,
	keysensor,
	altimeter,
	accelerometer,
	lidarsensor,
	radiotransmitter,
	radioreciever,

	radarsection,

	constant,
	delayblock: delayBlock,

	counter,
	logicmemory,
	stackmemory,
	randomaccessmemory,
	readonlymemory,
	operationbuffer: anyProcessing,
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

	operationmod: twoNumberInputsNumberOutput,

	operationrad: numberProcessing,
	operationdeg: numberProcessing,

	operationclamp,
	operationabs: numberProcessing,
	operationsign: numberProcessing,

	operationvec3splitter,
	operationvec3combiner,
} as const satisfies { [k in BlockId]?: BlockConfigBothDefinitions };

type BlockConfigDefinitions = ConfigTypesToDefinition<keyof BlockConfigTypes.Types, BlockConfigTypes.Types>;
type BlockConfigBothDefinitions = {
	readonly input: BlockConfigDefinitions;
	readonly output: BlockConfigDefinitions;
};

export type BlockConfigRegistry = Readonly<Record<keyof typeof blockConfigRegistry, BlockConfigBothDefinitions>>;
export type BlockConfigRegistryNonGeneric = Readonly<Record<string, BlockConfigBothDefinitions | undefined>>;
