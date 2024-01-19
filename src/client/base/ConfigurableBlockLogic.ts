import blockConfigRegistryClient from "client/blocks/config/BlockConfigRegistryClient";
import BlockConfig from "shared/BlockConfig";
import { BlockConfigBothDefinitions, BlockConfigDefinition } from "shared/BlockConfigDefinitionRegistry";
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

		const config = BlockConfig.addDefaults(block.config, configDefinition.input);
		const createInput = (key: string, definition: BlockConfigDefinition) => {
			const connected = key in block.connections;
			if (connected) {
				return blockConfigRegistryClient[definition.type].createObservable(definition as never);
			}

			const input = this.add(
				new blockConfigRegistryClient[definition.type].input(config[key] as never, definition as never),
			);

			this.event.subscribeObservable(
				this.enableControls,
				(enabled) => {
					if (enabled) input.enable();
					else input.disable();
				},
				true,
			);

			return input.value;
		};

		this.input = Objects.fromEntries(
			Objects.entries(configDefinition.input).map((d) => [d[0], createInput(d[0], d[1])] as const),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entries(configDefinition.output).map(
				(d) => [d[0], blockConfigRegistryClient[d[1].type].createObservable(d[1] as never)] as const,
			),
		) as typeof this.output;
	}
}
