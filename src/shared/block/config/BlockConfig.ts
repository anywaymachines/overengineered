import { PlacedBlockData } from "../../building/BlockManager";
import JSON from "../../fixes/Json";
import Objects from "../../fixes/objects";
import { BlockConfigDefinitions, BlockConfigDefinitionsToConfig } from "./BlockConfigDefinitionRegistry";

export default class BlockConfig {
	static deserialize<TDef extends BlockConfigDefinitions>(
		block: PlacedBlockData,
		definition: TDef,
	): BlockConfigDefinitionsToConfig<TDef> {
		return this.addDefaults(
			JSON.deserialize(
				(block.instance.GetAttribute("config") as string | undefined) ?? "{}",
			) as BlockConfigDefinitionsToConfig<TDef>,
			definition,
		);
	}

	static addDefaults<TDef extends BlockConfigDefinitions>(
		config: Partial<BlockConfigDefinitionsToConfig<TDef>>,
		definition: TDef,
	): BlockConfigDefinitionsToConfig<TDef> {
		for (const [key, def] of Objects.pairs(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				config[key] = {
					...((def.config as object) ?? {}),
					...(config[key] ?? {}),
				} as (typeof config)[typeof key];

				for (const [k, v] of Objects.entries(config[key]!)) {
					if (!typeIs(v, "table")) continue;

					config[key]![k] = {
						...(def.config[k as keyof typeof def.config] as object),
						...(v ?? {}),
					};
				}
			} else config[key] ??= def.config;
		}

		return config as BlockConfigDefinitionsToConfig<TDef>;
	}
}
