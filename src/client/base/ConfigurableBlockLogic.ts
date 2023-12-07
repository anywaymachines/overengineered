import { BlockConfig } from "client/blocks/BlockConfig";
import { ConfigTypesToDefinition, ConfigValueTypes } from "shared/Configuration";
import BlockLogic from "./BlockLogic";

export default abstract class ConfigurableBlockLogic<TConfig extends ConfigValueTypes> extends BlockLogic {
	public readonly config: BlockConfig<TConfig>;

	constructor(block: Model) {
		super(block);
		this.config = new BlockConfig<TConfig>(block, this.getConfigDefinition());
	}

	public abstract getConfigDefinition(): ConfigTypesToDefinition<TConfig>;
}
