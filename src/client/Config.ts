import Objects from "shared/_fixes_/objects";
import InputController from "./controller/InputController";

export default class Config<TDef extends ConfigDefinitions> {
	public readonly definitions: TDef;
	private readonly config: Partial<ConfigDefinitionsToConfig<TDef>> | undefined;

	constructor(config: Partial<ConfigDefinitionsToConfig<TDef>> | undefined, definitions: TDef) {
		this.definitions = definitions;
		this.config = config;
	}

	public get<TKey extends keyof TDef>(key: TKey): (typeof this.config & defined)[TKey] & defined {
		return (
			this.config?.[key] ??
			this.definitions[key].default[InputController.inputType.get()] ??
			this.definitions[key].default.Desktop
		);
	}
	public set<TKey extends keyof TDef>(key: TKey, value: (typeof this.config & defined)[TKey] & defined) {
		if (!this.config) return;
		this.config[key] = value;
	}

	/** Returns the configuration with all undefined keys set to their default values */
	public getAll(): ConfigDefinitionsToConfig<TDef> {
		const cfg: Partial<Record<keyof TDef, ConfigValue>> = {};
		for (const key of Objects.keys(this.definitions)) {
			cfg[key] = this.get(key);
		}

		return cfg as ConfigDefinitionsToConfig<TDef>;
	}

	static deserialize<TDef extends ConfigDefinitions>(
		content: Readonly<Record<keyof TDef, string>>,
		definitions: TDef,
	) {
		const result: Partial<ConfigDefinitionsToConfig<TDef>> = {};

		for (const [key, value] of Objects.entries(content)) {
			const convertIf = <TType extends keyof ConfigDefinitionType>(
				checkType: TType,
				convert: () => ConfigValueOf<ConfigDefinitionType[TType]>,
			) => {
				if (definitions[key].type !== checkType) return;
				result[key] = convert();
			};

			convertIf("key", () => value as KeyCode);
			convertIf("bool", () => value === "Y");
			convertIf("number", () => tonumber(value)!);
		}

		return result as ConfigDefinitionsToConfig<TDef>;
	}

	static serializeOne(value: ConfigValue, definition: ConfigDefinition) {
		const convertIf = <TType extends keyof ConfigDefinitionType>(
			checkType: TType,
			convert: (value: ConfigValueOf<ConfigDefinitionType[TType]>) => string,
		) => {
			if (definition.type !== checkType) return;
			return convert(value as ConfigValueOf<ConfigDefinitionType[TType]>);
		};

		return (
			convertIf("key", (value) => value) ??
			convertIf("bool", (value) => (value ? "Y" : "N")) ??
			convertIf("number", (value) => tostring(value))!
		);
	}
}
