import { BlockLogicValue, IBlockLogicValue, ReadonlyBlockLogicValue } from "shared/block/BlockLogicValue";
import { NumberBlockLogicValue } from "shared/block/NumberBlockLogicValue";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import BlockLogic, { BlockLogicData } from "./BlockLogic";

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
	clampedNumber: (definition) =>
		new NumberBlockLogicValue(definition.default, definition.min, definition.max, definition.step),
	thrust: () => new NumberBlockLogicValue(0, 0, 100, 0.01),
	motorRotationSpeed: (def) => new NumberBlockLogicValue(0, -def.maxSpeed, def.maxSpeed, 0.01),
	servoMotorAngle: () => new NumberBlockLogicValue(0, -180, 180, 0.01),
	or: createObservable,
} as const satisfies BlockConfigValueRegistry;

export default abstract class ConfigurableBlockLogic<
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
			Objects.entries(configDefinition.input).map(
				(d) => [d[0], BlockConfigValueRegistry[d[1].type](d[1] as never)] as const,
			),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entries(configDefinition.output).map(
				(d) => [d[0], BlockConfigValueRegistry[d[1].type](d[1] as never)] as const,
			),
		) as typeof this.output;
	}

	getEvent() {
		return this.event;
	}
}
