import { PlacedBlockData } from "shared/building/BlockManager";
import { Config } from "shared/config/Config";
import JSON from "shared/fixes/Json";

export const BlockConfig = {
	deserialize: <TDef extends BlockConfigTypes.Definitions>(
		block: PlacedBlockData,
		definition: TDef,
	): ConfigDefinitionsToConfig<keyof TDef, TDef> => {
		return Config.addDefaults(
			JSON.deserialize(
				(block.instance.GetAttribute("config") as string | undefined) ?? "{}",
			) as ConfigDefinitionsToConfig<keyof TDef, TDef>,
			definition,
		);
	},
} as const;
