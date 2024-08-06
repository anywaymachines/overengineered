import { BlockLogicValue } from "shared/block/BlockLogicValue";
import { ByteBlockLogicValue } from "shared/block/ByteBlockLogicValue";
import { NumberBlockLogicValue } from "shared/block/NumberBlockLogicValue";
import { Component } from "shared/component/Component";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { ArgsSignal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import { RemoteEvents } from "shared/RemoteEvents";
import { PartUtils } from "shared/utils/PartUtils";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";
import type { PlacedBlockConfig2 } from "shared/blockLogic/BlockConfig";
import type { ReadonlySubscribeObservableValue } from "shared/event/ObservableValue";

type Keys = BlockConfigTypes2.TypeKeys;
type Types = BlockConfigTypes2.Types;

type ConfigPart<TKey extends Keys> = BlockConfigTypes2.Types[TKey]["config"];
export type BlockConfigTypedPart<T extends Keys> = {
	readonly type: T;
	readonly config: ConfigPart<T>;
};

export type BlockConfigType = {
	readonly displayName: string;
	readonly group?: string;
	readonly types: { readonly [k in keyof BlockConfigTypes2.Types]?: BlockConfigTypes2.Types[k] };
	readonly defaultType: keyof BlockConfigTypes2.Types;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
};

export type BlockConfigDefinition = {
	readonly [k in string]: BlockConfigType;
};
export type BlockConfigBothDefinitions = {
	readonly input: BlockConfigDefinition;
	readonly output: BlockConfigDefinition;
};

export type PlacedBlockData2<T extends BlockModel = BlockModel> = ReplaceWith<
	BlockDataBase,
	{ readonly config: PlacedBlockConfig2; readonly instance: T }
>;

class BlockLogicBase<T extends BlockModel = BlockModel> extends InstanceComponent<T> {
	readonly block: PlacedBlockData2<T>;

	constructor(block: PlacedBlockData2) {
		super(block.instance as T);
		this.block = block as typeof this.block;
	}

	protected onDescendantDestroyed(func: () => void) {
		const subscribe = (instance: Instance) => {
			const update = () => {
				if (instance.IsA("BasePart") && !instance.CanTouch) {
					return;
				}

				func();
			};

			instance.GetPropertyChangedSignal("Parent").Once(update);
			instance.Destroying.Once(update);
		};

		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) => subscribe(part));
		PartUtils.applyToAllDescendantsOfType("Constraint", this.instance, (part) => subscribe(part));
		PartUtils.applyToAllDescendantsOfType("WeldConstraint", this.instance, (part) => subscribe(part));
	}
}

const createObservable = <TDef extends BlockConfigTypes2.Types[keyof BlockConfigTypes2.Types]>(
	definition: TDef,
): IBlockLogicValue<TDef["default"]> => {
	return new BlockLogicValue(definition.default);
};
const BlockConfigValueRegistry: BlockConfigValueRegistry = {
	unset: createObservable,
	bool: createObservable,
	vector3: createObservable,
	key: createObservable,
	multikey: createObservable,
	keybool: createObservable,
	number: createObservable,
	string: createObservable,
	color: createObservable,
	byte: (definition) => new ByteBlockLogicValue(definition.default),
	clampedNumber: (definition) =>
		new NumberBlockLogicValue(definition.default, definition.min, definition.max, definition.step),
	thrust: () => new NumberBlockLogicValue(0, 0, 100, 0.001),
	motorRotationSpeed: (def) => new NumberBlockLogicValue(0, -def.maxSpeed, def.maxSpeed, 0.001),
	servoMotorAngle: (def) => new NumberBlockLogicValue(def.default, def.minAngle, def.maxAngle, 0.001),
	controllableNumber: (definition) =>
		new NumberBlockLogicValue(definition.config.value, definition.min, definition.max, definition.step),
	bytearray: createObservable,
};
type BlockConfigValueRegistry = {
	readonly [k in keyof BlockConfigTypes2.Types]: (
		definition: BlockConfigTypes2.Types[k],
	) => IBlockLogicValue<BlockConfigTypes2.Types[k]["default"]>;
};

type ReadonlyBlockLogicMultiValue<TTypes extends keyof BlockConfigTypes2.Types> = {
	readonly changed: ReadonlyArgsSignal<
		[
			value: { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] },
			prev: { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] },
		]
	>;

	get(): { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] };
};
type WriteonlyBlockLogicMultiValue<TTypes extends keyof BlockConfigTypes2.Types> = {
	set<TType extends TTypes>(vtype: TType, value: BlockConfigTypes2.Types[TType]["default"]): void;
};
type IBlockLogicMultiValue<TTypes extends keyof BlockConfigTypes2.Types> = ReadonlyBlockLogicMultiValue<TTypes> &
	WriteonlyBlockLogicMultiValue<TTypes>;

type BlockLogicMultiValueTypes<TTypes extends keyof BlockConfigTypes2.Types> = {
	readonly [k in TTypes]: IBlockLogicValue<BlockConfigTypes2.Types[k]["default"]>;
};
class BlockLogicMultiValue<TTypes extends keyof BlockConfigTypes2.Types>
	extends Component
	implements
		ReadonlySubscribeObservableValue<{
			readonly valueType: TTypes;
			readonly value: BlockConfigTypes2.Types[TTypes]["default"];
		}>,
		IBlockLogicMultiValue<TTypes>
{
	private readonly _changed = new ArgsSignal<
		[
			value: { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] },
			prev: { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] },
		]
	>();
	readonly changed = this._changed.asReadonly();

	private currentType: TTypes;

	constructor(
		defaultType: TTypes,
		private readonly logics: BlockLogicMultiValueTypes<TTypes>,
	) {
		super();
		this.currentType = defaultType;

		let prev:
			| {
					readonly valueType: TTypes;
					readonly value: BlockConfigTypes2.Types[TTypes]["default"];
			  }
			| undefined;
		this.onEnable(() => {
			for (const [k, v] of pairs(logics)) {
				this.eventHandler.register(
					v.subscribe((value) => {
						const v = { valueType: k, value };
						this._changed.Fire(v, prev ?? v);

						prev = v;
					}),
				);
			}
		});
	}

	set<TType extends TTypes>(vtype: TType, value: BlockConfigTypes2.Types[TType]["default"]): void {
		if (!this.isEnabled()) return;

		this.currentType = vtype;
		this.logics[vtype].set(value);
	}
	get(): { readonly valueType: TTypes; readonly value: BlockConfigTypes2.Types[TTypes]["default"] } {
		return { valueType: this.currentType, value: this.logics[this.currentType].get() };
	}
}

type GenericBlockConfigBothDefinitions = {
	readonly input: { [k in string]: BlockConfigType };
	readonly output: { [k in string]: BlockConfigType };
};

export type GenericBlockLogicCtor<
	TDef extends BlockConfigBothDefinitions = GenericBlockConfigBothDefinitions,
	TBlock extends BlockModel = BlockModel,
> = new (block: PlacedBlockData2, ...args: any[]) => GenericBlockLogic<TDef, TBlock>;

export type GenericBlockLogic<
	TDef extends BlockConfigBothDefinitions = GenericBlockConfigBothDefinitions,
	TBlock extends BlockModel = BlockModel,
> = BlockLogic<TDef, TBlock>;

export abstract class BlockLogic<
	TDef extends BlockConfigBothDefinitions,
	TBlock extends BlockModel = BlockModel,
> extends BlockLogicBase<TBlock> {
	readonly input: {
		readonly [k in keyof TDef["input"]]: IBlockLogicMultiValue<
			keyof TDef["input"][k]["types"] & keyof BlockConfigTypes2.Types
		>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: IBlockLogicMultiValue<
			keyof TDef["output"][k]["types"] & keyof BlockConfigTypes2.Types
		>;
	};

	constructor(
		block: PlacedBlockData2,
		readonly configDefinition: TDef,
	) {
		super(block as never);

		for (const [k, v] of pairs(configDefinition.input)) {
			if (!(v.defaultType in v.types)) {
				throw `Invalid default input type ${v.defaultType} on the block ${block.id} key ${k} (allowed: ${Objects.keys(v.types).join()})`;
			}
		}
		for (const [k, v] of pairs(configDefinition.output)) {
			if (!(v.defaultType in v.types)) {
				throw `Invalid default output type ${v.defaultType} on the block ${block.id} key ${k} (allowed: ${Objects.keys(v.types).join()})`;
			}
		}

		const create = (defs: BlockConfigDefinition) => {
			const inputs: { [k in string]: IBlockLogicMultiValue<keyof BlockConfigTypes2.Types> } = {};
			for (const [k, v] of pairs(defs)) {
				const values: {
					-readonly [k in keyof BlockConfigTypes2.Types]?: IBlockLogicValue<
						BlockConfigTypes2.Types[keyof BlockConfigTypes2.Types]["default"]
					>;
				} = {};
				for (const [ctype, cval] of pairs(v.types)) {
					values[ctype] = BlockConfigValueRegistry[ctype](cval as never);
				}

				const multivalue = new BlockLogicMultiValue(
					v.defaultType,
					values as BlockLogicMultiValueTypes<keyof BlockConfigTypes2.Types>,
				);

				this.parent(multivalue);
				inputs[k] = multivalue;
			}

			return inputs;
		};
		this.input = create(configDefinition.input) as typeof this.input;
		this.output = create(configDefinition.output) as typeof this.output;

		if (this.diesFromNanOrInf()) {
			const subInvalidValue = (values: {
				readonly [k in string]: IBlockLogicMultiValue<keyof BlockConfigTypes2.Types>;
			}) => {
				for (const [, input] of pairs(values)) {
					input.changed.Connect(({ value }) => {
						// if infinity or nan
						if (value === math.huge || value === -math.huge || value !== value) {
							RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
							this.disable();
						}
					});
				}
			};

			subInvalidValue(this.input);
			subInvalidValue(this.output);
		}
	}

	/** @returns Does this block light itself on fire upon receiving a `NaN`, `+INF` or `-INF` on any of the inputs/outputs */
	protected diesFromNanOrInf(): boolean {
		return true;
	}

	tick(tick: number): void {
		if (!this.isEnabled()) return;

		for (const [, value] of pairs(this.input)) {
			(value as unknown as BlockLogicValue<defined>).tick(tick);
		}
		for (const [, value] of pairs(this.output)) {
			(value as unknown as BlockLogicValue<defined>).tick(tick);
		}
	}

	disable(): void {
		for (const [, value] of pairs(this.input)) {
			//	value.destroy();
		}
		for (const [, value] of pairs(this.output)) {
			//	value.destroy();
		}

		super.disable();
	}
}
