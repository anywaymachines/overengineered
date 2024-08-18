import { RunService } from "@rbxts/services";
import { connectors } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { SharedBlockGenerator } from "shared/block/SharedBlockGenerator";
import { Objects } from "shared/fixes/objects";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogic } from "shared/block/BlockLogic";
import type { BlockId } from "shared/BlockDataRegistry";
import type { PlacedBlockData } from "shared/building/BlockManager";

interface CreateInfo<TKey extends keyof typeof logicReg> {
	readonly func: Parameters<(typeof logicReg)[TKey]>[0];
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
	numberOrBool(
		name: string,
		group?: string,
		additional?: Partial<
			ConfigTypeToDefinition<BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Bool]>>
		>,
	): ConfigTypeToDefinition<BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Bool]>> {
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
				bool: {
					displayName: "Bool",
					type: "bool",
					default: false as boolean,
					config: false as boolean,
				},
			},
			...(additional ?? {}),
		};
	},
	numberOrByteOrBool(
		name: string,
		group?: string,
		additional?: Partial<
			ConfigTypeToDefinition<
				BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Bool, BlockConfigTypes.Byte]>
			>
		>,
	): ConfigTypeToDefinition<
		BlockConfigTypes.Or<[BlockConfigTypes.Number, BlockConfigTypes.Bool, BlockConfigTypes.Byte]>
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
				number: {
					displayName: "Number",
					type: "number",
					default: 0 as number,
					config: 0 as number,
				},
				bool: {
					displayName: "Bool",
					type: "bool",
					default: false as boolean,
					config: false as boolean,
				},
				byte: {
					displayName: "Byte",
					type: "byte",
					default: 0 as number,
					config: 0 as number,
				},
			},
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
			value: defcs.bool("State"),
			truevalue: connectors.any("True value", "1"),
			falsevalue: connectors.any("False value", "1"),
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
	numberOrBool2bool: {
		input: {
			value1: defcs.numberOrBool("Value 1"),
			value2: defcs.numberOrBool("Value 2"),
		},
		output: {
			result: defcs.bool("Result"),
		},
	},
	numberOrByteOrBool2bool: {
		input: {
			value1: defcs.numberOrByteOrBool("Value 1"),
			value2: defcs.numberOrByteOrBool("Value 2"),
		},
		output: {
			result: defcs.bool("Result"),
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
	numberOrBool2bool: (func: <T extends number | boolean>(left: T, right: T, logic: BlockLogic) => boolean) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.numberOrBool2bool> {
			constructor(block: PlacedBlockData) {
				super(block, defs.numberOrBool2bool);

				const update = () =>
					this.output.result.set(func(this.input.value1.get(), this.input.value2.get(), this));
				this.input.value1.subscribe(update);
				this.input.value2.subscribe(update);
			}
		};
	},
	numberOrByteOrBool2bool: (func: <T extends number | boolean>(left: T, right: T, logic: BlockLogic) => boolean) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.numberOrByteOrBool2bool> {
			constructor(block: PlacedBlockData) {
				super(block, defs.numberOrBool2bool);

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

	throw `in ${(arg as ConfigurableBlockLogic<BlockConfigTypes.BothDefinitions>).instance}, unknown type ${typeOf(left)} ${typeOf(right)} insteadof ${Objects.entriesArray(
		checks,
	)
		.map((e) => `${e[0]}`)
		.join()} ${debug.traceback()}`;
};
const multiifunc =
	<TArg, T>(checks: Checks<TArg>): ((left: T, right: T, arg: TArg) => T) =>
	(left, right, arg) =>
		multiif(arg, left, right, checks);

const operations = {
	const: {
		constant: {
			func: (value) => value,
		},
	},

	constnumber: {
		pi: {
			func: () => math.pi,
		},
		e: {
			func: () => 2.718281828459,
		},
	},
	math1number: {
		sqrt: {
			func: (value) => math.sqrt(value),
		},

		tan: {
			func: (value) => math.tan(value),
		},
		atan: {
			func: (value) => math.atan(value),
		},

		sin: {
			func: (value) => math.sin(value),
		},
		asin: {
			func: (value) => math.asin(value),
		},

		cos: {
			func: (value) => math.cos(value),
		},
		acos: {
			func: (value) => math.acos(value),
		},

		log: {
			func: (value) => math.log(value),
		},
		log10: {
			func: (value) => math.log10(value),
		},
		loge: {
			func: (value) => math.log(value, 2.718281828459),
		},

		deg: {
			func: (value) => math.deg(value),
		},
		rad: {
			func: (value) => math.rad(value),
		},

		sign: {
			func: (value) => math.sign(value),
		},

		floor: {
			func: (value) => math.floor(value),
		},

		ceil: {
			func: (value) => math.ceil(value),
		},

		round: {
			func: (value) => math.round(value),
		},

		abs: {
			func: (value) => math.abs(value),
		},
	},
	rand: {
		rand: {
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
		clamp: {
			func: (value, min, max) => math.clamp(value, min, max),
		},
	},
	pow: {
		pow: {
			func: (value, power) => math.pow(value, power),
		},
	},
	nsqrt: {
		nsqrt: {
			func: (value, root) => value ** (1 / root),
		},
	},
	atan2: {
		atan2: {
			func: (y, x) => math.atan2(y, x),
		},
	},
	math2number: {
		mod: {
			func: (value1, value2) => value1 % value2,
		},
	},
	numberOrBool2bool: {},
	numberOrByteOrBool2bool: {
		equals: {
			func: (value1, value2) => value1 === value2,
		},
		notequals: {
			func: (value1, value2) => value1 !== value2,
		},
	},
	number2bool: {
		greaterthan: {
			func: (value1, value2) => value1 > value2,
		},
		greaterthanorequals: {
			func: (value1, value2) => value1 >= value2,
		},
		lessthan: {
			func: (value1, value2) => value1 < value2,
		},
		lessthanorequals: {
			func: (value1, value2) => value1 <= value2,
		},
	},
	math2numberVector3: {
		add: {
			func: multiifunc({
				number: (left, right) => left + right,
				Vector3: (left, right) => left.add(right),
			}),
		},
		sub: {
			func: multiifunc({
				number: (left, right) => left - right,
				Vector3: (left, right) => left.sub(right),
			}),
		},
		mul: {
			func: multiifunc({
				number: (left, right) => left * right,
				Vector3: (left, right) => left.mul(right),
			}),
		},
		div: {
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
		bytenot: {
			func: (num) => ~num & 0xff,
		},
		byteneg: {
			func: (num) => -num & 0xff,
		},
	},
	byte2byte: {
		bytexor: {
			func: (a, b) => a ^ b,
		},
		bytexnor: {
			func: (a, b) => ~(a ^ b) & 0xff,
		},
		byteand: {
			func: (a, b) => a & b,
		},
		bytenand: {
			func: (a, b) => ~(a & b) & 0xff,
		},
		byteor: {
			func: (a, b) => a | b,
		},
		bytenor: {
			func: (a, b) => ~(a | b) & 0xff,
		},
		byterotateright: {
			func: (num, shift) => ((num >>> shift) | (num << (8 - shift))) & 0xff,
		},
		byterotateleft: {
			func: (num, shift) => ((num << shift) | (num >>> (8 - shift))) & 0xff,
		},
		byteshiftright: {
			func: (num, shift) => (num >> shift) & 0xff,
		},
		byteshiftleft: {
			func: (num, shift) => (num << shift) & 0xff,
		},
		bytearithmeticshiftright: {
			func: (num, shift) => (num >> shift) | ((num & 0x80) !== 0 ? 0xff << (8 - shift) : 0),
		},
	},
	bool2bool: {
		xor: {
			func: (x, y) => x !== y,
		},
		xnor: {
			func: (x, y) => !(x !== y),
		},
		and: {
			func: (x, y) => x && y,
		},
		nand: {
			func: (x, y) => !(x && y),
		},
		or: {
			func: (x, y) => x || y,
		},
		nor: {
			func: (x, y) => !(x || y),
		},
	},
	bool1bool: {
		not: {
			func: (x) => !x,
		},
	},
	numberToByte: {
		numbertobyte: {
			func: (value) => math.clamp(value, 0, 255),
		},
	},
	byteToNumber: {
		bytetonumber: {
			func: (value) => value,
		},
	},
	number3tovector3: {
		vec3combiner: {
			func: (n1, n2, n3) => new Vector3(n1, n2, n3),
		},
	},
	vector3tonumber3: {
		vec3splitter: {
			func: (vector3) => [vector3.X, vector3.Y, vector3.Z],
		},
	},
	multiplexer: {
		multiplexer: {
			func: (value, truevalue, falsevalue) => (value ? truevalue : falsevalue),
		},
	},
} as const satisfies NonGenericOperations;

type NonGenericOperations = {
	readonly [k in keyof typeof logicReg]: {
		readonly [id in BlockId]?: CreateInfo<k>;
	};
};

export namespace AutoLogicCreator {
	export function create() {
		for (const [optype, ops] of pairs(operations as NonGenericOperations)) {
			for (const [name, data] of pairs(ops)) {
				SharedBlockGenerator.registerLogic(
					name.lower() as BlockId,
					logicReg[optype](data.func as never),
					defs[optype],
				);
			}
		}
	}
}
