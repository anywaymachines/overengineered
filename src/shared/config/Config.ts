import { Objects } from "shared/fixes/objects";

export namespace Config {
	export function addDefaults<TKeys extends keyof TDef & string, TDef extends UnknownConfigDefinitions>(
		config: Partial<ConfigDefinitionsToConfig<TKeys, TDef>>,
		definition: TDef,
	): ConfigDefinitionsToConfig<TKeys, TDef> {
		for (const [key, def] of Objects.pairs_(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				if (
					config[key] !== undefined &&
					def.config !== undefined &&
					typeOf(config[key]) !== typeOf(def.config)
				) {
					config[key] = def.config;
				} else {
					config[key] = {
						...((def.config as object) ?? {}),
						...(config[key] ?? {}),
					} as (typeof config)[typeof key];
				}

				for (const [k, v] of Objects.pairs_(config[key]!)) {
					if (!typeIs(v, "table")) continue;

					config[key]![k] = {
						...((def.config as object)[k as keyof typeof def.config] as object),
						...(v ?? {}),
					};
				}
			} else config[key] ??= def.config;
		}

		return config as ConfigDefinitionsToConfig<TKeys, TDef>;
	}
}
