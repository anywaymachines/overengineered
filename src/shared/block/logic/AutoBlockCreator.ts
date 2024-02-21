import { RunService } from "@rbxts/services";
import { BlockDataRegistry } from "shared/Blocks";
import RemoteEvents from "shared/RemoteEvents";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import BlockLogic from "shared/block/BlockLogic";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import logicRegistry, { LogicRegistry } from "shared/block/LogicRegistry";
import blockConfigRegistry, { BlockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import Objects from "shared/fixes/objects";

interface BlockResult extends BlockAdditional {
	readonly id: string;
	readonly displayName: string;
	readonly info: string;
	readonly prefab: string;
}
interface BlockAdditional {
	readonly category: readonly string[];
	readonly required?: boolean;
	readonly limit?: number;
}
interface CreateInfo<TFunc> extends BlockAdditional {
	readonly func: TFunc;
}

const createBase = (displayName: string, prefab: string, additional: BlockAdditional): BlockResult => {
	const id = `operation${displayName.lower()}`;
	displayName = BlockDataRegistry[id].name;
	const info = BlockDataRegistry[id].description;

	return {
		id,
		displayName,
		info,
		prefab,
		...additional,
	};
};

/** @server */
const initializeBlock = (block: BlockResult) => {
	let currentCategory: Folder | undefined;
	for (const category of block.category) {
		currentCategory = (currentCategory?.WaitForChild(category) ??
			ReplicatedAssets.get<{ Placeable: Folder }>().Placeable.WaitForChild(category)) as Folder;
	}

	if (!currentCategory) throw "No category";

	const createModel = (prefab: BlockModel, text: string): BlockModel => {
		prefab = prefab.Clone();
		prefab.FindFirstChildWhichIsA("TextLabel", true)!.Text = text;

		return prefab;
	};
	const model = createModel(
		ReplicatedAssets.get<{ Prefabs: Record<string, BlockModel> }>().Prefabs[block.prefab],
		block.displayName,
	);

	model.Name = block.id;
	model.SetAttribute("id", block.id);
	model.SetAttribute("name", block.displayName);
	model.SetAttribute("info", block.info);
	if (block.required !== undefined) model.SetAttribute("required", block.required);
	if (block.limit !== undefined) model.SetAttribute("limit", block.limit);
	model.Parent = currentCategory;
};

//

const defcs = {
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
				type: "number",
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
} as const;

const defs = {
	math1number: {
		input: {
			value: defcs.number("Value"),
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
	math2numberVector3: {
		input: {
			value1: defcs.numberOrVector("Value 1"),
			value2: defcs.numberOrVector("Value 2"),
		},
		output: {
			result: defcs.numberOrVector("Result"),
		},
	},
} as const satisfies Record<string, BlockConfigTypes.BothDefinitions>;

const regblock = (displayName: string, additional: BlockAdditional): BlockResult => {
	const data = createBase(displayName, "OperationPrefab", additional);
	if (RunService.IsServer()) {
		initializeBlock(data);
	}

	return data;
};
const reglogic = (
	name: string,
	logic: new (block: PlacedBlockData) => BlockLogic,
	def: BlockConfigTypes.BothDefinitions,
) => {
	(logicRegistry as unknown as Writable<LogicRegistry>)[name as keyof LogicRegistry] = logic as never;
	(blockConfigRegistry as Writable<BlockConfigRegistry>)[name as keyof BlockConfigRegistry] = def;
};
const logicReg = {
	math1number: (func: (value: number, logic: BlockLogic) => number) => {
		return class Logic extends ConfigurableBlockLogic<typeof defs.math1number> {
			constructor(block: PlacedBlockData) {
				super(block, defs.math1number);

				const update = () => this.output.result.set(func(this.input.value.get(), this));
				this.input.value.subscribe(update);
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
	for (const [typename, func] of Objects.pairs(checks)) {
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
const operations = {
	math1number: {
		//NEG: { category: mathCategory, func: (value) => -value },
	},
	math2number: {},
	math2numberVector3: {
		ADD: {
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left + right,
				Vector3: (left, right) => left.add(right),
			}),
		},
		SUB: {
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left - right,
				Vector3: (left, right) => left.sub(right),
			}),
		},
		MUL: {
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left * right,
				Vector3: (left, right) => left.mul(right),
			}),
		},
		DIV: {
			category: mathCategory,
			func: multiifunc({
				number: (left, right, logic) => {
					if (right === 0) {
						RemoteEvents.Burn.send(logic.instance.PrimaryPart!);
						logic.disable();
					}

					return left / right;
				},
				Vector3: (left, right, logic) => {
					if (right.X === 0 && right.Y === 0 && right.Z === 0) {
						RemoteEvents.Burn.send(logic.instance.PrimaryPart!);
						logic.disable();
					}

					return left.div(right);
				},
			}),
		},
	},
} as const satisfies { [k in keyof typeof logicReg]: Record<string, CreateInfo<Parameters<(typeof logicReg)[k]>[0]>> };

for (const [optype, ops] of Objects.pairs(operations)) {
	for (const [name, data] of Objects.pairs(ops)) {
		print(`[BLOCKAUTOCREATE] Creating block ${name}`);
		const block = regblock(name, data);

		const logic = logicReg[optype]((data as { func: never }).func);
		reglogic(block.id, logic, defs[optype]);
	}
}

//

type operations = typeof operations;
type toBlockLogic<T extends keyof operations> = {
	readonly [k in `operation${Lowercase<keyof operations[T] & string>}`]: ReturnType<(typeof logicReg)[T]>;
};
declare global {
	type AutoCreatedLogicRegistryTypes = toBlockLogic<"math1number"> & toBlockLogic<"math2number">;
}

export const AutoBlockCreator = {
	// empty method to trigger the import
	initialize() {},
} as const;
