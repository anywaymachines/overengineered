import Objects from "shared/fixes/objects";

export const Config = {
	addDefaults: <TKeys extends keyof TDef & string, TDef extends UnknownConfigDefinitions>(
		config: Partial<ConfigDefinitionsToConfig<TKeys, TDef>>,
		definition: TDef,
	): ConfigDefinitionsToConfig<TKeys, TDef> => {
		for (const [key, def] of Objects.pairs(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				config[key] = {
					...((def.config as object) ?? {}),
					...(config[key] ?? {}),
				} as (typeof config)[typeof key];

				for (const [k, v] of Objects.entries(config[key]!)) {
					if (!typeIs(v, "table")) continue;

					config[key]![k] = {
						...((def.config as object)[k as keyof typeof def.config] as object),
						...(v ?? {}),
					};
				}
			} else config[key] ??= def.config;
		}

		return config as ConfigDefinitionsToConfig<TKeys, TDef>;
	},
} as const;
