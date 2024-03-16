import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import BlockLogic, { BlockLogicData } from "./BlockLogic";

type BlockConfigValueRegistry = {
	readonly [k in keyof BlockConfigTypes.Types]: (
		definition: BlockConfigTypes.Types[k],
	) => ObservableValue<BlockConfigTypes.Types[k]["default"]>;
};

const createObservable = <TDef extends BlockConfigTypes.Types[keyof BlockConfigTypes.Types]>(
	definition: TDef,
): ObservableValue<TDef["default"]> => {
	return new ObservableValue(definition.default);
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
		new NumberObservableValue(definition.default, definition.min, definition.max, definition.step),
	thrust: () => new NumberObservableValue<number>(0, 0, 100, 0.01),
	motorRotationSpeed: (def) => new NumberObservableValue<number>(0, -def.maxSpeed, def.maxSpeed, 0.01),
	servoMotorAngle: () => new NumberObservableValue<number>(0, -180, 180, 0.01),
	or: createObservable,
} as const satisfies BlockConfigValueRegistry;

export default abstract class ConfigurableBlockLogic<
	TDef extends BlockConfigTypes.BothDefinitions,
	TBlock extends BlockModel = BlockModel,
> extends BlockLogic {
	readonly enableControls = new ObservableValue(false);
	readonly input: {
		readonly [k in keyof TDef["input"]]: ReadonlyObservableValue<TDef["input"][k]["default"]>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: ObservableValue<TDef["output"][k]["default"]>;
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
