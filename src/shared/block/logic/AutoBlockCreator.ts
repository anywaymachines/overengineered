import { RunService } from "@rbxts/services";
import { $log } from "rbxts-transformer-macros";
import { BlockDataRegistry, BlockId } from "shared/BlockDataRegistry";
import type { BlocksInitializeData } from "shared/BlocksInitializer";
import { Element } from "shared/Element";
import { RemoteEvents } from "shared/RemoteEvents";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { BlockLogic } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { LogicRegistry, logicRegistry } from "shared/block/LogicRegistry";
import { BlockConfigRegistry, blockConfigRegistry, connectors } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { Objects } from "shared/fixes/objects";

interface BlockResult extends BlockAdditional {
	readonly id: BlockId;
	readonly displayName: string;
	readonly info: string;
	readonly prefab: string;
}
interface BlockAdditional {
	readonly category: readonly string[];
	readonly required?: boolean;
	readonly limit?: number;
	readonly prefab: string;
}
interface CreateInfo<TFunc> extends BlockAdditional {
	readonly func: TFunc;
	readonly modelTextOverride?: string;
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

const reglogic = (
	name: string,
	logic: new (block: PlacedBlockData) => BlockLogic,
	def: BlockConfigTypes.BothDefinitions,
) => {
	(logicRegistry as unknown as Writable<LogicRegistry>)[name as keyof LogicRegistry] = logic as never;
	(blockConfigRegistry as Writable<BlockConfigRegistry>)[name as keyof BlockConfigRegistry] = def;
};
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
	for (const [typename, func] of Objects.pairs_(checks)) {
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

const mathCategory = ["Logic", "Math"];
const byteCategory = ["Logic", "Math", "Byte"];
const converterByteCategory = ["Logic", "Converter", "Byte"];
const otherCategory = ["Logic", "Other"];
const boolCategory = ["Logic", "Gate"];

const constPrefab = "ConstLogicBlockPrefab";
const smallGenericPrefab = "GenericLogicBlockPrefab";
const doubleGenericPrefab = "DoubleGenericLogicBlockPrefab";
const smallBytePrefab = "ByteLogicBlockPrefab";
const doubleBytePrefab = "DoubleByteLogicBlockPrefab";

const operations = {
	const: {
		Constant: {
			modelTextOverride: "CONST",
			category: otherCategory,
			prefab: constPrefab,
			func: (value) => value,
		},
	},
	constnumber: {
		PI: {
			modelTextOverride: "π",
			category: otherCategory,
			prefab: constPrefab,
			func: () => math.pi,
		},
		E: {
			modelTextOverride: "e",
			category: otherCategory,
			prefab: constPrefab,
			func: () => 2.718281828459,
		},
	},
	math1number: {
		//NEG: { category: mathCategory, func: (value) => -value },
		SQRT: {
			modelTextOverride: "SQRT",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.sqrt(value),
		},

		TAN: {
			modelTextOverride: "TAN",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.tan(value),
		},
		ATAN: {
			modelTextOverride: "ATAN",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.atan(value),
		},

		SIN: {
			modelTextOverride: "SIN",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.sin(value),
		},
		ASIN: {
			modelTextOverride: "ASIN",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.asin(value),
		},

		COS: {
			modelTextOverride: "COS",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.cos(value),
		},
		ACOS: {
			modelTextOverride: "ACOS",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.acos(value),
		},

		LOG: {
			modelTextOverride: "LOG",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.log(value),
		},
		LOG10: {
			modelTextOverride: "LOG10",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.log10(value),
		},
		LOGE: {
			modelTextOverride: "LOG(E)",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.log(value, 2.718281828459),
		},

		DEG: {
			modelTextOverride: "DEG",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.deg(value),
		},
		RAD: {
			modelTextOverride: "RAD",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.rad(value),
		},

		SIGN: {
			modelTextOverride: "SIGN",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.sign(value),
		},

		FLOOR: {
			modelTextOverride: "Floor",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.floor(value),
		},

		CEIL: {
			modelTextOverride: "Ceil",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.ceil(value),
		},

		ABS: {
			modelTextOverride: "ABS",
			category: mathCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.abs(value),
		},
	},
	rand: {
		RAND: {
			modelTextOverride: "RAND",
			category: mathCategory,
			prefab: doubleGenericPrefab,
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
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value, min, max) => math.clamp(value, min, max),
		},
	},
	pow: {
		POW: {
			modelTextOverride: "POW",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value, power) => math.pow(value, power),
		},
	},
	nsqrt: {
		NSQRT: {
			modelTextOverride: "NSQRT",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value, root) => value ** (1 / root),
		},
	},
	atan2: {
		ATAN2: {
			modelTextOverride: "ATAN2",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (y, x) => math.atan2(y, x),
		},
	},
	math2number: {
		MOD: {
			modelTextOverride: "MOD",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 % value2,
		},
	},
	number2bool: {
		EQUALS: {
			modelTextOverride: "=",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 === value2,
		},
		NOTEQUALS: {
			modelTextOverride: "≠",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 === value2,
		},
		GREATERTHAN: {
			modelTextOverride: ">",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 > value2,
		},
		GREATERTHANOREQUALS: {
			modelTextOverride: "≥",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 >= value2,
		},
		LESSTHAN: {
			modelTextOverride: "<",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 < value2,
		},
		LESSTHANOREQUALS: {
			modelTextOverride: "≤",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: (value1, value2) => value1 <= value2,
		},
	},
	math2numberVector3: {
		ADD: {
			modelTextOverride: "ADD",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: multiifunc({
				number: (left, right) => left + right,
				Vector3: (left, right) => left.add(right),
			}),
		},
		SUB: {
			modelTextOverride: "SUB",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: multiifunc({
				number: (left, right) => left - right,
				Vector3: (left, right) => left.sub(right),
			}),
		},
		MUL: {
			modelTextOverride: "MUL",
			category: mathCategory,
			prefab: doubleGenericPrefab,
			func: multiifunc({
				number: (left, right) => left * right,
				Vector3: (left, right) => left.mul(right),
			}),
		},
		DIV: {
			modelTextOverride: "DIV",
			category: mathCategory,
			prefab: doubleGenericPrefab,
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
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num) => ~num & 0xff,
		},
		byteNEG: {
			modelTextOverride: "BNEG",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num) => -num & 0xff,
		},
	},
	byte2byte: {
		byteXOR: {
			modelTextOverride: "BXOR",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => a ^ b,
		},
		byteXNOR: {
			modelTextOverride: "BXNOR",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => ~(a ^ b) & 0xff,
		},
		byteAND: {
			modelTextOverride: "BAND",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => a & b,
		},
		byteNAND: {
			modelTextOverride: "BNAND",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => ~(a & b) & 0xff,
		},
		byteOR: {
			modelTextOverride: "BOR",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => a | b,
		},
		byteNOR: {
			modelTextOverride: "BNOR",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (a, b) => ~(a | b) & 0xff,
		},
		byteRotateRight: {
			modelTextOverride: "ROT. RIGHT",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num, shift) => ((num >>> shift) | (num << (8 - shift))) & 0xff,
		},
		byteRotateLeft: {
			modelTextOverride: "ROT. LEFT",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num, shift) => ((num << shift) | (num >>> (8 - shift))) & 0xff,
		},
		byteShiftRight: {
			modelTextOverride: "Shift RIGHT",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num, shift) => (num >> shift) & 0xff,
		},
		byteShiftLEFT: {
			modelTextOverride: "Shift LEFT",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num, shift) => (num << shift) & 0xff,
		},
		byteArithmeticShiftRight: {
			modelTextOverride: "Arithmetic Shift RIGHT",
			category: byteCategory,
			prefab: doubleBytePrefab,
			func: (num, shift) => (num >> shift) | ((num & 0x80) !== 0 ? 0xff << (8 - shift) : 0),
		},
	},
	bool2bool: {
		XOR: {
			modelTextOverride: "XOR",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => x !== y,
		},
		XNOR: {
			modelTextOverride: "XNOR",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => !(x !== y),
		},
		AND: {
			modelTextOverride: "AND",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => x && y,
		},
		NAND: {
			modelTextOverride: "NAND",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => !(x && y),
		},
		OR: {
			modelTextOverride: "OR",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => x || y,
		},
		NOR: {
			modelTextOverride: "NOR",
			category: boolCategory,
			prefab: doubleGenericPrefab,
			func: (x, y) => !(x || y),
		},
	},
	bool1bool: {
		NOT: {
			modelTextOverride: "NOT",
			category: boolCategory,
			prefab: smallGenericPrefab,
			func: (x) => !x,
		},
	},
	numberToByte: {
		NumberToByte: {
			modelTextOverride: "TO BYTE",
			category: converterByteCategory,
			prefab: smallGenericPrefab,
			func: (value) => math.clamp(value, 0, 255),
		},
	},
	byteToNumber: {
		ByteToNumber: {
			modelTextOverride: "TO NUMBER",
			category: converterByteCategory,
			prefab: smallBytePrefab,
			func: (value) => value,
		},
	},
} as const satisfies NonGenericOperations;
type NonGenericOperations = {
	readonly [k in keyof typeof logicReg]: Record<string, CreateInfo<Parameters<(typeof logicReg)[k]>[0]>>;
};

const create = (info: BlocksInitializeData) => {
	/** @server */
	const initializeBlockModel = (
		id: string,
		prefab: string,
		displayName: string,
		modelTextOverride: string | undefined,
	): BlockModel => {
		const model = ReplicatedAssets.get<{ Prefabs: Record<string, BlockModel> }>().Prefabs[prefab].Clone();
		model.Name = id;
		model.FindFirstChildWhichIsA("TextLabel", true)!.Text = modelTextOverride ?? displayName;
		model.Parent = ReplicatedAssets.get<{ PlaceableAutomatic: Folder }>().PlaceableAutomatic;

		return model;
	};
	const createBase = (displayName: string, additional: BlockAdditional): BlockResult => {
		const id = `operation${displayName.lower()}` as BlockId;
		if (!(id in BlockDataRegistry)) {
			throw `Block ${id} was not found in the data registry`;
		}

		const setupinfo = BlockDataRegistry[id];
		displayName = setupinfo.name;
		const info = setupinfo.description;

		return {
			id,
			displayName,
			info,
			...additional,
		};
	};

	if (RunService.IsServer()) {
		Element.create("Folder", {
			Name: "PlaceableAutomatic",
			Parent: ReplicatedAssets.get<Folder>(),
		});
	}
	for (const [optype, ops] of Objects.pairs_(operations as NonGenericOperations)) {
		for (const [name, data] of Objects.pairs_(ops)) {
			$log(`Creating block ${name}`);

			const block = createBase(name, data);
			const setupinfo = BlockDataRegistry[block.id];
			const regblock: RegistryBlock = {
				id: block.id,
				displayName: block.displayName,
				info: block.info,
				category: block.category[block.category.size() - 1] as RegistryBlock["category"],
				model: RunService.IsClient()
					? ReplicatedAssets.get<{ PlaceableAutomatic: Record<string, BlockModel> }>().PlaceableAutomatic[
							block.id
						]
					: initializeBlockModel(block.id, block.prefab, block.displayName, data.modelTextOverride),
				autoWeldShape: setupinfo.autoWeldShape,
				limit: setupinfo.limit,
				mirrorBehaviour: setupinfo.mirrorBehaviour,
				mirrorReplacementId: setupinfo.mirrorReplacementId as BlockId | undefined,
				required: setupinfo.required,
			};
			info.blocks.set(regblock.id, regblock);

			// automatically create categories
			//some magic idk DO NOT TOUCH
			{
				let cat: (typeof info.categories)[CategoryName] | undefined = undefined;
				for (const c of block.category) {
					const se = (cat?.sub ?? info.categories) as Writable<typeof info.categories>;
					if (!se[c as CategoryName]) {
						se[c as CategoryName] = { name: c as CategoryName, sub: {} };
					}

					const newcat = se[c as CategoryName];
					if (cat) {
						(cat.sub as Writable<typeof cat.sub>)[c as CategoryName] = newcat;
					}

					cat = newcat;
				}
			}

			const logic = logicReg[optype](data.func as never);
			reglogic(block.id, logic, defs[optype]);
		}
	}
};

export const AutoBlockCreator = {
	create,
} as const;
