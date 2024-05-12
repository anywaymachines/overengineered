
export namespace Config {
	export function addDefaults<TKeys extends keyof TDef & string, TDef extends UnknownConfigDefinitions>(
		config: Partial<ConfigDefinitionsToConfig<TKeys, TDef>>,
		definition: TDef,
	): ConfigDefinitionsToConfig<TKeys, TDef> {
		for (const [key, def] of pairs(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				if (
					config[key] !== undefined &&
					def.config !== undefined &&
					typeOf(config[key]) !== typeOf(def.config)
				) {
					config[key] = def.config;
				} else if (
					(config[key] === undefined || typeIs(config[key], "table")) &&
					(def.config === undefined || typeIs(def.config, "table"))
				) {
					config[key] = {
						...((def.config as object) ?? {}),
						...(config[key] ?? {}),
					} as (typeof config)[typeof key];
				}

				if (typeIs(config[key], "table") && typeIs(def.config, "table")) {
					for (const [k, v] of pairs(config[key]!)) {
						if (!typeIs(v, "table")) continue;
						if (
							typeIs(def.config, "table") &&
							!typeIs((def.config as never as Record<keyof TDef, unknown>)[k], "table")
						) {
							continue;
						}

						config[key]![k] = {
							...((def.config as object)[k as keyof typeof def.config] as object),
							...(v ?? {}),
						};
					}
				}
			} else {
				config[key] ??= def.config;
			}
		}

		return config as ConfigDefinitionsToConfig<TKeys, TDef>;
	}
}
