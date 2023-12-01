import ConfigWrapper from "client/blocks/ConfigWrapper";
import BlockRegistry from "shared/registry/BlocksRegistry";
import BlockLogic from "./BlockLogic";

type ConfigDefinitionToConfig<T extends Readonly<Record<string, ConfigDefinition>>> = {
	readonly [k in keyof T]: T[k]["default"]["Desktop"];
};

export default abstract class ConfigurableBlockLogic<TConfigurableBlock extends ConfigurableBlock> extends BlockLogic {
	protected readonly config;

	constructor(block: Model) {
		super(block);

		const b = BlockRegistry.Blocks.get(block.GetAttribute("id") as string) as unknown as TConfigurableBlock;

		this.config = new ConfigWrapper<
			ConfigDefinitionToConfig<ReturnType<TConfigurableBlock["getConfigDefinitions"]>>
		>(block, b.getConfigDefinitions() as ReturnType<TConfigurableBlock["getConfigDefinitions"]>);
	}
}
