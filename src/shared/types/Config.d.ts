type DefaultConfigValue<T> = Readonly<{ Desktop: T } & Partial<Record<InputType, T>>>;

type ConfigDefinitionTypeBase<TKey extends string, TValue, TAdditional extends {} = {}> = {
	readonly [k in TKey]: {
		readonly type: k;
		readonly displayName: string;
		readonly default: DefaultConfigValue<TValue>;
	} & TAdditional;
};

type KeyCode = Enum.KeyCode["Name"];
type KeyConfigDefinitionType = ConfigDefinitionTypeBase<"key", KeyCode>;
type BoolConfigDefinitionType = ConfigDefinitionTypeBase<"bool", boolean>;
type NumberConfigDefinitionType = ConfigDefinitionTypeBase<
	"number",
	number,
	{
		readonly min: number;
		readonly max: number;
		readonly step: number;
	}
>;

type ConfigDefinitionType = KeyConfigDefinitionType & BoolConfigDefinitionType & NumberConfigDefinitionType;
type ConfigDefinition = ConfigDefinitionType[keyof ConfigDefinitionType];

type ConfigDefinitions = Readonly<Record<string, ConfigDefinition>>;

type ConfigValueType = keyof ConfigDefinitionType;
type ConfigValueTypes = Readonly<Record<string, ConfigValueType>>;

type ConfigValueOf<T extends ConfigDefinition> = T["default"]["Desktop"];
type ConfigValue = ConfigValueOf<ConfigDefinition>;
type ConfigValues = Readonly<Record<string, ConfigValue>>;

type ConfigTypesToConfig<T extends ConfigValueTypes> = {
	[k in keyof T]: ConfigValueOf<ConfigDefinitionType[T[k]]>;
};

type ConfigTypesToDefinition<T extends ConfigValueTypes> = {
	readonly [k in keyof T]: ConfigDefinitionType[T[k]];
};

type ConfigDefinitionToTypes<T extends ConfigDefinitions> = {
	readonly [k in keyof T]: T[k]["type"];
};

type ConfigDefinitionsToConfig<T extends ConfigDefinitions> = {
	[k in keyof T]: ConfigValueOf<ConfigDefinitionType[T[k]["type"]]>;
};
