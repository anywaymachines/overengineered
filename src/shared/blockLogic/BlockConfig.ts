import type { BlockConfigType } from "shared/blockLogic/BlockLogic";

type Keys = BlockConfigTypes2.TypeKeys;

type ConfigPart<TKey extends Keys> = {
	readonly type: TKey;
	readonly config: BlockConfigTypes2.Types[TKey]["config"] | undefined;
};
export type DefinedConfigPart<TKey extends Keys> = {
	readonly type: TKey;
	readonly config: BlockConfigTypes2.Types[TKey]["config"];
};

type GenericConfig = ConfigPart<Keys>;
type GenericDefinedConfig = DefinedConfigPart<Keys>;

export type PlacedBlockConfig2 = {
	readonly [k in string]?: { [k in Keys]: ConfigPart<k> }[Keys];
};
export type DefinedPlacedBlockConfig2 = {
	readonly [k in string]: { [k in Keys]: DefinedConfigPart<k> }[Keys];
};

export namespace BlockConfig {
	type Def = {
		readonly [k in string]: BlockConfigType;
	};

	export function addDefaults<TDef extends Def>(
		config: PlacedBlockConfig2 | undefined,
		definition: TDef,
	): DefinedPlacedBlockConfig2 {
		const result: { [k in string]?: GenericConfig } = { ...(config ?? {}) };

		for (const [k, def] of pairs(definition)) {
			assert(typeIs(k, "string"));

			const obj = result[k];
			if (!obj) {
				const cfg: GenericDefinedConfig = {
					type: def.defaultType,
					config: def.types[def.defaultType]!.config,
				};
				result[k] = cfg;

				continue;
			}

			const defConfig = def.types[obj.type]!.config;

			if (typeIs(defConfig, "table")) {
				if (obj.config !== undefined && !typeIs(obj.config, "table")) {
					throw "wrong stuff bruh";
				}

				const cfg: GenericDefinedConfig = {
					...obj,
					config: {
						...(obj.config ?? {}),
						...defConfig,
					},
				};
				result[k] = cfg;

				continue;
			}

			const cfg: GenericDefinedConfig = {
				...obj,
				config: defConfig,
			};
			result[k] = cfg;
		}

		return result as DefinedPlacedBlockConfig2;
	}
}
