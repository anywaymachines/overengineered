import {
	BlockConfigDefinition,
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
} from "./BlockConfigDefinitionRegistry";
import JSON from "./_fixes_/Json";
import Objects from "./_fixes_/objects";

export default class BlockConfig {
	static deserialize<TDef extends Readonly<Record<string, BlockConfigDefinition>>>(
		block: BlockModel,
		definition: TDef,
	): BlockConfigDefinitionsToConfig<TDef> {
		return this.addDefaults(
			JSON.deserialize(
				(block.GetAttribute("config") as string | undefined) ?? "{}",
			) as BlockConfigDefinitionsToConfig<TDef>,
			definition,
		);
	}

	static addDefaults<TDef extends BlockConfigDefinitions>(
		config: Partial<BlockConfigDefinitionsToConfig<TDef>>,
		definition: TDef,
	): BlockConfigDefinitionsToConfig<TDef> {
		for (const [key, def] of Objects.entries(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				config[key] = {
					...((def.config as object) ?? {}),
					...(config[key] ?? {}),
				};
			} else config[key] ??= def.config;
		}

		return config as BlockConfigDefinitionsToConfig<TDef>;
	}
}
