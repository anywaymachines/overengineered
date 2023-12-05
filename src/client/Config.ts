import Signals from "client/event/Signals";
import Objects from "shared/Objects";

export class Config<T extends ConfigValueTypes> {
	private readonly definitions: ConfigTypesToDefinition<T>;
	private readonly config: ConfigTypesToConfig<T> | undefined;

	constructor(config: ConfigTypesToConfig<T> | undefined, definitions: ConfigTypesToDefinition<T>) {
		this.definitions = definitions;
		this.config = config;
	}

	public static deserialize<T extends ConfigValueTypes>(
		content: Readonly<Record<keyof T, string>>,
		definitions: ConfigTypesToDefinition<T>,
	) {
		const result: Partial<ConfigTypesToConfig<T>> = {};

		for (const [key, value] of Objects.entries(content)) {
			const convertIf = <TType extends keyof ConfigDefinitionType>(
				checkType: TType,
				convert: () => ConfigValueOf<ConfigDefinitionType[TType]>,
			) => {
				if (definitions[key].type !== checkType) return;
				result[key] = convert();
			};

			convertIf("key", () => Enum.KeyCode.GetEnumItems().find((k) => k.Name === value)!);
			convertIf("bool", () => value === "Y");
			convertIf("number", () => tonumber(value)!);
		}

		return result as ConfigTypesToConfig<T>;
	}

	public static serializeOne<TValue extends ConfigValue, TDef extends ConfigDefinition>(
		value: TValue,
		definition: TDef,
	) {
		const convertIf = <TType extends keyof ConfigDefinitionType>(
			checkType: TType,
			convert: (value: ConfigValueOf<ConfigDefinitionType[TType]>) => string,
		) => {
			if (definition.type !== checkType) return;
			return convert(value as ConfigValueOf<ConfigDefinitionType[TType]>);
		};

		return (
			convertIf("key", (value) => value.Name) ??
			convertIf("bool", (value) => (value ? "Y" : "N")) ??
			convertIf("number", (value) => tostring(value))!
		);
	}

	public get<TKey extends keyof T>(key: TKey): ConfigValueOf<ConfigDefinitionType[T[TKey]]> {
		return (
			this.config?.[key] ??
			this.definitions[key].default[Signals.INPUT_TYPE.get()] ??
			this.definitions[key].default.Desktop
		);
	}
	public set<TKey extends keyof T>(key: TKey, value: ConfigValueOf<ConfigDefinitionType[T[TKey]]>) {
		if (!this.config) return;
		this.config[key] = value;
	}
}
