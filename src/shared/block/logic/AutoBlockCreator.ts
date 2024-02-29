import { RunService } from "@rbxts/services";
import { BlockDataRegistry } from "shared/BlockDataRegistry";
import type { BlocksInitializeData } from "shared/BlocksInitializer";
import { Element } from "shared/Element";
import Logger from "shared/Logger";
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
			value1: defcs.numberOrVector("Value 1", "1"),
			value2: defcs.numberOrVector("Value 2", "1"),
		},
		output: {
			result: defcs.numberOrVector("Result", "1"),
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
			modelTextOverride: "ADD",
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left + right,
				Vector3: (left, right) => left.add(right),
			}),
		},
		SUB: {
			modelTextOverride: "SUB",
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left - right,
				Vector3: (left, right) => left.sub(right),
			}),
		},
		MUL: {
			modelTextOverride: "MUL",
			category: mathCategory,
			func: multiifunc({
				number: (left, right) => left * right,
				Vector3: (left, right) => left.mul(right),
			}),
		},
		DIV: {
			modelTextOverride: "DIV",
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
} as const satisfies NonGenericOperations;
type NonGenericOperations = {
	readonly [k in keyof typeof logicReg]: Record<string, CreateInfo<Parameters<(typeof logicReg)[k]>[0]>>;
};

type operations = typeof operations;
type toBlockLogic<T extends keyof operations> = {
	readonly [k in `operation${Lowercase<keyof operations[T] & string>}`]: ReturnType<(typeof logicReg)[T]>;
};
declare global {
	type AutoCreatedLogicRegistryTypes = toBlockLogic<"math1number"> &
		toBlockLogic<"math2number"> &
		toBlockLogic<"math2numberVector3">;
}

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

	if (RunService.IsServer()) {
		Element.create("Folder", {
			Name: "PlaceableAutomatic",
			Parent: ReplicatedAssets.get<Folder>(),
		});
	}
	for (const [optype, ops] of Objects.pairs(operations as NonGenericOperations)) {
		for (const [name, data] of Objects.pairs(ops)) {
			Logger.info(`[BAC] Creating block ${name}`);

			const block = createBase(name, "OperationPrefab", data);
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
			};
			info.blocks.set(regblock.id, regblock);

			const logic = logicReg[optype](data.func as never);
			reglogic(block.id, logic, defs[optype]);
		}
	}
};

export const AutoBlockCreator = {
	create,
} as const;
