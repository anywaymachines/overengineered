import { BlockConfigBothDefinitions } from "shared/BlockConfigDefinitionRegistry";
import BlockConfigValueRegistry from "shared/BlockConfigValueRegistry";
import Objects from "shared/_fixes_/objects";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import BlockLogic, { BlockLogicData } from "./BlockLogic";

export default class ConfigurableBlockLogic<
	TDef extends BlockConfigBothDefinitions,
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
		super(block);
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
}
