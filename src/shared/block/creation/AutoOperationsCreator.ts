import { RunService } from "@rbxts/services";
import { BlockId } from "shared/BlockDataRegistry";
import type { BlocksInitializeData } from "shared/BlocksInitializer";
import { RemoteEvents } from "shared/RemoteEvents";
import { BlockLogic } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { connectors } from "shared/block/config/BlockConfigRegistry";
import { BlockGenerator } from "shared/block/creation/BlockGenerator";
import { PlacedBlockData } from "shared/building/BlockManager";

interface CreateInfo<TFunc> {
	readonly modelTextOverride: string;
	readonly category: readonly string[];
	readonly prefab: BlockGenerator.PrefabName;
	readonly func: TFunc;
	readonly required?: boolean;
	readonly limit?: number;
}

const defcs = {
	bool(
		name: string,
		additional?: Partial<ConfigTypeToDefinition<BlockConfigTypes.Bool>>,
	): ConfigTypeToDefinition<BlockConfigTypes.Bool> {
		return {
			displayName: name,
			type: "bool",
			default: false as boolean,
			config: false as boolean,
			...(additional ?? {}),
		};
	},
	vector3(
		name: string,
		additional?: Partial<ConfigTypeToDefinition<BlockConfigTypes.Vec3>>,
	): ConfigTypeToDefinition<BlockConfigTypes.Vec3> {
		return {
			displayName: name,
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
			...(additional ?? {}),
		};
	},
	number(
		name: string,
		additional?: Partial<ConfigTypeToDefinition<BlockConfigTypes.Number>>,
	): ConfigTypeToDefinition<BlockConfigTypes.Number> {
		return {
			displayName: name,
			type: "number",
			default: 0 as number,
			config: 0 as number,
			...(additional ?? {}),
		};
	},
	numberOrVector(
		name: string,
		group?: string,
		additional?: Partial<
			ConfigTypeToDefinition<BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Vec3]>>
		>,
	): ConfigTypeToDefinition<BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Vec3]>> {
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
	byte(
		name: string,
		additional?: Partial<ConfigTypeToDefinition<BlockConfigTypes.Byte>>,
	): ConfigTypeToDefinition<BlockConfigTypes.Byte> {
		return {
			displayName: name,
			type: "byte",
			default: 0 as number,
			config: 0 as number,
			...(additional ?? {}),
		};
	},
} as const;

const defs = {
	multiplexer: {
		input: {
			value: defcs.bool("Value 1/2"),
			truevalue: connectors.any("Channel 1", "1"),
			falsevalue: connectors.any("Channel 2", "1"),
		},
		output: {
			result: connectors.any("Result", "1"),
		},
	},
	number3tovector3: {
		input: {
			value_x: defcs.number("X"),
			value_y: defcs.number("Y"),
			value_z: defcs.number("Z"),
		},
		output: {
			result: defcs.vector3("Result"),
		},
	},
	vector3tonumber3: {
		input: {
			value: defcs.vector3("Value"),
		},
		output: {
			result_x: defcs.number("X"),
			result_y: defcs.number("Y"),
			result_z: defcs.number("Z"),
		},
	},
	const: {
		input: {
			value: connectors.any("Value", "1", { connectorHidden: true }),
		},
		output: {
			result: connectors.any("Value", "1"),
		},
	},
	constnumber: {
		input: {},
		output: {
			value: defcs.number("Value"),
		},
	},
	math1number: {
		input: {
			value: defcs.number("Value"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	rand: {
		input: {
			min: defcs.number("Min", { default: 0, config: 0 }),
			max: defcs.number("Max", { default: 1, config: 1 }),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	nsqrt: {
		input: {
			value: defcs.number("Value"),
			root: defcs.number("Degree"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	pow: {
		input: {
			value: defcs.number("Value"),
			power: defcs.number("Power"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	clamp: {
		input: {
			value: defcs.number("Value"),
			min: defcs.number("Min"),
			max: defcs.number("Max"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	atan2: {
		input: {
			y: defcs.number("Y"),
			x: defcs.number("X"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	math2number: {
		input: {
			value1: defcs.number("Value 1"),
			value2: defcs.number("Value 2"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	number2bool: {
		input: {
			value1: defcs.number("Value 1"),
			value2: defcs.number("Value 2"),
		},
		output: {
			result: defcs.bool("Result"),
		},
	},
	math2numberVector3: {
		input: {
			value1: defcs.numberOrVector("Value 1", "1"),
			value2: defcs.numberOrVector("Value 2", "1"),
		},
		output: {
			result: defcs.numberOrVector("Result", "1"),
		},
	},
	byte2byte: {
		input: {
			value1: defcs.byte("Value 1"),
			value2: defcs.byte("Value 2"),
		},
		output: {
			result: defcs.byte("Result"),
		},
	},
	byteToNumber: {
		input: {
			value: defcs.byte("Value"),
		},
		output: {
			result: defcs.number("Result"),
		},
	},
	numberToByte: {
		input: {
			value: defcs.number("Value"),
		},
		output: {
			result: defcs.byte("Result"),
		},
	},
	byte1byte: {
		input: {
			value: defcs.byte("Value"),
		},
		output: {
			result: defcs.byte("Result"),
		},
	},
	bool2bool: {
		input: {
			value1: defcs.bool("Value 1"),
			value2: defcs.bool("Value 2"),
		},
		output: {
			result: defcs.bool("Result"),
		},
	},
	bool1bool: {
		input: {
			value: defcs.bool("Value"),
		},
		output: {
			result: defcs.bool("Result"),
		},
	},
} as const satisfies Record<string, BlockConfigTypes.BothDefinitions>;

const logicReg = {
	const: (
		func: (
			value: ReturnType<typeof connectors.any>["default"],
			logic: BlockLogic,
		) => ReturnType<typeof connectors.any>["default"],
	) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.const> {
			constructor(block: PlacedBlockData) {
				super(block, defs.const);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.onEnable(update);
			}
		};
	},
	constnumber: (func: (logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.constnumber> {
			constructor(block: PlacedBlockData) {
				super(block, defs.constnumber);

				const update = () => this.output.value.set(func(this));
				this.onEnable(update);
			}
		};
	},
	rand: (func: (min: number, max: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.rand> {
			constructor(block: PlacedBlockData) {
				super(block, defs.rand);

				const update = () => this.output.result.set(func(this.input.min.get(), this.input.max.get(), this));
				this.input.min.subscribe(update);
				this.input.max.subscribe(update);
				this.event.subscribe(RunService.Heartbeat, update);
			}
		};
	},
	math1number: (func: (value: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.math1number> {
			constructor(block: PlacedBlockData) {
				super(block, defs.math1number);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
			}
		};
	},
	nsqrt: (func: (value: number, root: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.nsqrt> {
			constructor(block: PlacedBlockData) {
				super(block, defs.nsqrt);

				const update = () => this.output.result.set(func(this.input.value.get(), this.input.root.get(), this));
				this.input.value.subscribe(update);
				this.input.root.subscribe(update);
			}
		};
	},
	pow: (func: (value: number, power: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.pow> {
			constructor(block: PlacedBlockData) {
				super(block, defs.pow);

				const update = () => this.output.result.set(func(this.input.value.get(), this.input.power.get(), this));
				this.input.value.subscribe(update);
				this.input.power.subscribe(update);
			}
		};
	},
	atan2: (func: (y: number, x: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.atan2> {
			constructor(block: PlacedBlockData) {
				super(block, defs.atan2);

				const update = () => this.output.result.set(func(this.input.y.get(), this.input.x.get(), this));
				this.input.y.subscribe(update);
				this.input.x.subscribe(update);
			}
		};
	},
	math2number: (func: (left: number, right: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.math2number> {
			constructor(block: PlacedBlockData) {
				super(block, defs.math2number);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},
	number2bool: (func: (left: number, right: number, logic: BlockLogic) => boolean) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.number2bool> {
			constructor(block: PlacedBlockData) {
				super(block, defs.number2bool);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},
	math2numberVector3: (
		func: <T extends number | Vector3>(left: T, right: T, logic: BlockLogic) => number | Vector3,
	) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.math2numberVector3> {
			constructor(block: PlacedBlockData) {
				super(block, defs.math2numberVector3);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},

	byte2byte: (func: (left: number, right: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.byte2byte> {
			constructor(block: PlacedBlockData) {
				super(block, defs.byte2byte);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},
	byte1byte: (func: (value: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.byte1byte> {
			constructor(block: PlacedBlockData) {
				super(block, defs.byte1byte);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
			}
		};
	},
	bool2bool: (func: (left: boolean, right: boolean, logic: BlockLogic) => boolean) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.bool2bool> {
			constructor(block: PlacedBlockData) {
				super(block, defs.bool2bool);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},
	bool1bool: (func: (left: boolean, logic: BlockLogic) => boolean) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.bool1bool> {
			constructor(block: PlacedBlockData) {
				super(block, defs.bool1bool);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
			}
		};
	},

	clamp: (func: (value: number, min: number, max: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.clamp> {
			constructor(block: PlacedBlockData) {
				super(block, defs.clamp);

				const update = () =>
					this.output.result.set(
						func(this.input.value.get(), this.input.min.get(), this.input.max.get(), this),
					);
				this.input.value.subscribe(update);
				this.input.min.subscribe(update);
				this.input.max.subscribe(update);
			}
		};
	},

	byteToNumber: (func: (value: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.byteToNumber> {
			constructor(block: PlacedBlockData) {
				super(block, defs.byteToNumber);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
			}
		};
	},

	numberToByte: (func: (value: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.numberToByte> {
			constructor(block: PlacedBlockData) {
				super(block, defs.numberToByte);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
			}
		};
	},

	vector3tonumber3: (func: (value: Vector3, logic: BlockLogic) => number[]) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.vector3tonumber3> {
			constructor(block: PlacedBlockData) {
				super(block, defs.vector3tonumber3);

				const update = () => {
					const axis = func(this.input.value.get(), this);
					this.output.result_x.set(axis[0]);
					this.output.result_y.set(axis[1]);
					this.output.result_z.set(axis[2]);
				};
				this.input.value.subscribe(update);
			}
		};
	},

	number3tovector3: (func: (n1: number, n2: number, n3: number, logic: BlockLogic) => Vector3) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.number3tovector3> {
			constructor(block: PlacedBlockData) {
				super(block, defs.number3tovector3);

				const update = () =>
					this.output.result.set(
						func(this.input.value_x.get(), this.input.value_y.get(), this.input.value_z.get(), this),
					);

				this.input.value_x.subscribe(update);
				this.input.value_y.subscribe(update);
				this.input.value_z.subscribe(update);
			}
		};
	},
	multiplexer: (
		func: (
			value: boolean,
			truevalue: ReturnType<typeof connectors.any>["default"],
			falsevalue: ReturnType<typeof connectors.any>["default"],
			logic: BlockLogic,
		) => ReturnType<typeof connectors.any>["default"],
	) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.multiplexer> {
			constructor(block: PlacedBlockData) {
				super(block, defs.multiplexer);

				const update = () =>
					this.output.result.set(
						func(this.input.value.get(), this.input.truevalue.get(), this.input.falsevalue.get(), this),
					);

				this.input.value.subscribe(update);
				this.input.truevalue.subscribe(update);
				this.input.falsevalue.subscribe(update);
			}
		};
	},
} as const satisfies Record<keyof typeof defs, unknown>;

//

type Check<TArg, T extends keyof CheckableTypes> = (
	left: CheckableTypes[T],
	right: CheckableTypes[T],
	arg: TArg,
) => CheckableTypes[T];
type Checks<TArg> = { readonly [k in keyof CheckableTypes]?: Check<TArg, k> };

const multiif = <TArg, T, TType extends keyof CheckableTypes, TRet extends CheckableTypes[TType]>(
	arg: TArg,
	left: T,
	right: T,
	checks: Checks<TArg>,
): TRet => {
	for (const [typename, func] of pairs(checks)) {
		if (typeIs(left, typename) && typeIs(right, typename)) {
			return func(left as never, right as never, arg) as never;
		}
	}

	throw "unknown type";
};
const multiifunc =
	<TArg, T>(checks: Checks<TArg>): ((left: T, right: T, arg: TArg) => T) =>
	(left, right, arg) =>
		multiif(arg, left, right, checks);

const prefabs = BlockGenerator.prefabNames;
const categories = {
	math: ["Logic", "Math"],
	byte: ["Logic", "Math", "Byte"],
	converterByte: ["Logic", "Converter", "Byte"],
	converterVector: ["Logic", "Converter", "Vector"],
	other: ["Logic", "Other"],
	bool: ["Logic", "Gate"],
} as const satisfies { [k in string]: readonly string[] };

const operations = {
	const: {
		Constant: {
			modelTextOverride: "CONST",
			category: categories.other,
			prefab: prefabs.const,
			func: (value) => value,
		},
	},
	constnumber: {
		PI: {
			modelTextOverride: "π",
			category: categories.other,
			prefab: prefabs.const,
			func: () => math.pi,
		},
		E: {
			modelTextOverride: "e",
			category: categories.other,
			prefab: prefabs.const,
			func: () => 2.718281828459,
		},
	},
	math1number: {
		SQRT: {
			modelTextOverride: "SQRT",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.sqrt(value),
		},

		TAN: {
			modelTextOverride: "TAN",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.tan(value),
		},
		ATAN: {
			modelTextOverride: "ATAN",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.atan(value),
		},

		SIN: {
			modelTextOverride: "SIN",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.sin(value),
		},
		ASIN: {
			modelTextOverride: "ASIN",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.asin(value),
		},

		COS: {
			modelTextOverride: "COS",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.cos(value),
		},
		ACOS: {
			modelTextOverride: "ACOS",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.acos(value),
		},

		LOG: {
			modelTextOverride: "LOG",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.log(value),
		},
		LOG10: {
			modelTextOverride: "LOG10",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.log10(value),
		},
		LOGE: {
			modelTextOverride: "LOG(E)",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.log(value, 2.718281828459),
		},

		DEG: {
			modelTextOverride: "DEG",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.deg(value),
		},
		RAD: {
			modelTextOverride: "RAD",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.rad(value),
		},

		SIGN: {
			modelTextOverride: "SIGN",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.sign(value),
		},

		FLOOR: {
			modelTextOverride: "FLOOR",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.floor(value),
		},

		CEIL: {
			modelTextOverride: "CEIL",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.ceil(value),
		},

		ROUND: {
			modelTextOverride: "ROUND",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.round(value),
		},

		ABS: {
			modelTextOverride: "ABS",
			category: categories.math,
			prefab: prefabs.smallGeneric,
			func: (value) => math.abs(value),
		},
	},
	rand: {
		RAND: {
			modelTextOverride: "RAND",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (min, max, logic) => {
				if (max <= min) {
					RemoteEvents.Burn.send([logic.instance.PrimaryPart!]);
					logic.disable();
					return 727;
				}

				return math.random() * (max - min) + min;
			},
		},
	},
	clamp: {
		CLAMP: {
			modelTextOverride: "CLAMP",
			category: categories.math,
			prefab: prefabs.tripleGeneric,
			func: (value, min, max) => math.clamp(value, min, max),
		},
	},
	pow: {
		POW: {
			modelTextOverride: "POW",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value, power) => math.pow(value, power),
		},
	},
	nsqrt: {
		NSQRT: {
			modelTextOverride: "NSQRT",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value, root) => value ** (1 / root),
		},
	},
	atan2: {
		ATAN2: {
			modelTextOverride: "ATAN2",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (y, x) => math.atan2(y, x),
		},
	},
	math2number: {
		MOD: {
			modelTextOverride: "MOD",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 % value2,
		},
	},
	number2bool: {
		EQUALS: {
			modelTextOverride: "=",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 === value2,
		},
		NOTEQUALS: {
			modelTextOverride: "≠",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 === value2,
		},
		GREATERTHAN: {
			modelTextOverride: ">",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 > value2,
		},
		GREATERTHANOREQUALS: {
			modelTextOverride: "≥",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 >= value2,
		},
		LESSTHAN: {
			modelTextOverride: "<",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 < value2,
		},
		LESSTHANOREQUALS: {
			modelTextOverride: "≤",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: (value1, value2) => value1 <= value2,
		},
	},
	math2numberVector3: {
		ADD: {
			modelTextOverride: "ADD",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: multiifunc({
				number: (left, right) => left + right,
				Vector3: (left, right) => left.add(right),
			}),
		},
		SUB: {
			modelTextOverride: "SUB",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: multiifunc({
				number: (left, right) => left - right,
				Vector3: (left, right) => left.sub(right),
			}),
		},
		MUL: {
			modelTextOverride: "MUL",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: multiifunc({
				number: (left, right) => left * right,
				Vector3: (left, right) => left.mul(right),
			}),
		},
		DIV: {
			modelTextOverride: "DIV",
			category: categories.math,
			prefab: prefabs.doubleGeneric,
			func: multiifunc({
				number: (left, right, logic) => {
					if (right === 0) {
						RemoteEvents.Burn.send([logic.instance.PrimaryPart!]);
						logic.disable();
					}

					return left / right;
				},
				Vector3: (left, right, logic) => {
					if (right.X === 0 && right.Y === 0 && right.Z === 0) {
						RemoteEvents.Burn.send([logic.instance.PrimaryPart!]);
						logic.disable();
					}

					return left.div(right);
				},
			}),
		},
	},
	byte1byte: {
		byteNOT: {
			modelTextOverride: "BNOT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num) => ~num & 0xff,
		},
		byteNEG: {
			modelTextOverride: "BNEG",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num) => -num & 0xff,
		},
	},
	byte2byte: {
		byteXOR: {
			modelTextOverride: "BXOR",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => a ^ b,
		},
		byteXNOR: {
			modelTextOverride: "BXNOR",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => ~(a ^ b) & 0xff,
		},
		byteAND: {
			modelTextOverride: "BAND",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => a & b,
		},
		byteNAND: {
			modelTextOverride: "BNAND",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => ~(a & b) & 0xff,
		},
		byteOR: {
			modelTextOverride: "BOR",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => a | b,
		},
		byteNOR: {
			modelTextOverride: "BNOR",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (a, b) => ~(a | b) & 0xff,
		},
		byteRotateRight: {
			modelTextOverride: "ROT. RIGHT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num, shift) => ((num >>> shift) | (num << (8 - shift))) & 0xff,
		},
		byteRotateLeft: {
			modelTextOverride: "ROT. LEFT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num, shift) => ((num << shift) | (num >>> (8 - shift))) & 0xff,
		},
		byteShiftRight: {
			modelTextOverride: "Shift RIGHT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num, shift) => (num >> shift) & 0xff,
		},
		byteShiftLEFT: {
			modelTextOverride: "Shift LEFT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num, shift) => (num << shift) & 0xff,
		},
		byteArithmeticShiftRight: {
			modelTextOverride: "Arithmetic Shift RIGHT",
			category: categories.byte,
			prefab: prefabs.doubleByte,
			func: (num, shift) => (num >> shift) | ((num & 0x80) !== 0 ? 0xff << (8 - shift) : 0),
		},
	},
	bool2bool: {
		XOR: {
			modelTextOverride: "XOR",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => x !== y,
		},
		XNOR: {
			modelTextOverride: "XNOR",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => !(x !== y),
		},
		AND: {
			modelTextOverride: "AND",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => x && y,
		},
		NAND: {
			modelTextOverride: "NAND",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => !(x && y),
		},
		OR: {
			modelTextOverride: "OR",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => x || y,
		},
		NOR: {
			modelTextOverride: "NOR",
			category: categories.bool,
			prefab: prefabs.doubleGeneric,
			func: (x, y) => !(x || y),
		},
	},
	bool1bool: {
		NOT: {
			modelTextOverride: "NOT",
			category: categories.bool,
			prefab: prefabs.smallGeneric,
			func: (x) => !x,
		},
	},
	numberToByte: {
		NumberToByte: {
			modelTextOverride: "TO BYTE",
			category: categories.converterByte,
			prefab: prefabs.smallGeneric,
			func: (value) => math.clamp(value, 0, 255),
		},
	},
	byteToNumber: {
		ByteToNumber: {
			modelTextOverride: "TO NUMBER",
			category: categories.converterByte,
			prefab: prefabs.smallByte,
			func: (value) => value,
		},
	},
	number3tovector3: {
		Vec3Combiner: {
			modelTextOverride: "VEC3 COMB",
			category: categories.converterVector,
			prefab: prefabs.tripleGeneric,
			func: (n1, n2, n3) => new Vector3(n1, n2, n3),
		},
	},
	vector3tonumber3: {
		Vec3Splitter: {
			modelTextOverride: "VEC3 SPLIT",
			category: categories.converterVector,
			prefab: prefabs.tripleGeneric,
			func: (vector3) => [vector3.X, vector3.Y, vector3.Z],
		},
	},
	multiplexer: {
		Multiplexer: {
			modelTextOverride: "MUX",
			category: categories.converterVector,
			prefab: prefabs.tripleGeneric,
			func: (value, truevalue, falsevalue) => (value ? truevalue : falsevalue),
		},
	},
} as const satisfies NonGenericOperations;

print(
	"DOUBLE",
	asMap(operations as NonGenericOperations)
		.flatmap((k, v) => asMap(v).map((k, v) => ({ k, v })))
		.filter(({ k, v }) => v.prefab === prefabs.tripleGeneric)
		.map(({ k, v }) => k.lower())
		.join(", "),
);

type NonGenericOperations = {
	readonly [k in keyof typeof logicReg]: Record<string, CreateInfo<Parameters<(typeof logicReg)[k]>[0]>>;
};

export namespace AutoOperationsCreator {
	export function create(info: BlocksInitializeData) {
		for (const [optype, ops] of pairs(operations as NonGenericOperations)) {
			for (const [name, data] of pairs(ops)) {
				BlockGenerator.create(info, {
					id: name.lower() as BlockId,
					...data,
					logic: logicReg[optype](data.func as never),
					config: defs[optype],
				});
			}
		}
	}
}
