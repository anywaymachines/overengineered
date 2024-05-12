import { RemoteEvents } from "shared/RemoteEvents";
import { BlockLogicValue, IBlockLogicValue, ReadonlyBlockLogicValue } from "shared/block/BlockLogicValue";
import { ByteBlockLogicValue } from "shared/block/ByteBlockLogicValue";
import { NumberBlockLogicValue } from "shared/block/NumberBlockLogicValue";
import { ObservableValue } from "shared/event/ObservableValue";
import { Objects } from "shared/fixes/objects";
import { BlockLogic, BlockLogicData } from "./BlockLogic";

type BlockConfigValueRegistry = {
	readonly [k in keyof BlockConfigTypes.Types]: (
		definition: BlockConfigTypes.Types[k],
	) => IBlockLogicValue<BlockConfigTypes.Types[k]["default"]>;
};

const createObservable = <TDef extends BlockConfigTypes.Types[keyof BlockConfigTypes.Types]>(
	definition: TDef,
): IBlockLogicValue<TDef["default"]> => {
	return new BlockLogicValue(definition.default);
};
const BlockConfigValueRegistry = {
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
	thrust: () => new NumberBlockLogicValue(0, 0, 100, 0.01),
	motorRotationSpeed: (def) => new NumberBlockLogicValue(0, -def.maxSpeed, def.maxSpeed, 0.01),
	servoMotorAngle: () => new NumberBlockLogicValue(0, -180, 180, 0.01),
	or: createObservable,
	controllableNumber: (definition) =>
		new NumberBlockLogicValue(definition.config.value, definition.min, definition.max, definition.step),
	bytearray: createObservable,
} as const satisfies BlockConfigValueRegistry;

export abstract class ConfigurableBlockLogic<
	TDef extends BlockConfigTypes.BothDefinitions,
	TBlock extends BlockModel = BlockModel,
> extends BlockLogic {
	readonly enableControls = new ObservableValue(false);
	readonly input: {
		readonly [k in keyof TDef["input"]]: ReadonlyBlockLogicValue<TDef["input"][k]["default"]>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: IBlockLogicValue<TDef["output"][k]["default"]>;
	};
	readonly block: BlockLogicData<TDef["input"], TBlock>;
	readonly instance: TBlock;

	constructor(block: BlockLogicData<TDef["input"]>, configDefinition: TDef) {
		super(block as never);
		this.block = block as typeof this.block;
		this.instance = this.block.instance;

		this.input = Objects.fromEntries(
			Objects.entriesArray(configDefinition.input).map(
				(d) => [d[0], BlockConfigValueRegistry[d[1].type](d[1] as never)] as const,
			),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entriesArray(configDefinition.output).map(
				(d) => [d[0], BlockConfigValueRegistry[d[1].type](d[1] as never)] as const,
			),
		) as typeof this.output;

		//

		const subInvalidValue = (values: Readonly<Record<string, ReadonlyBlockLogicValue<defined>>>) => {
			for (const [, input] of pairs(values)) {
				input.subscribe((value) => {
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
			(value as unknown as BlockLogicValue<defined>).destroy();
		}
		for (const [, value] of pairs(this.output)) {
			(value as unknown as BlockLogicValue<defined>).destroy();
		}

		super.disable();
	}
}
