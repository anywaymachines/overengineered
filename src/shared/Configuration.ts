export type DefaultConfigValue<T> = Readonly<{ Desktop: T } & Partial<Record<InputType, T>>>;

export type ConfigDefinitionTypeBase<TKey extends string, TValue, TAdditional extends {} = {}> = {
	readonly [k in TKey]: {
		readonly type: k;
		readonly id: string;
		readonly displayName: string;
		readonly default: DefaultConfigValue<TValue>;
	} & TAdditional;
};

export type KeyCode = Enum.KeyCode["Name"];
export type KeyConfigDefinitionType = ConfigDefinitionTypeBase<"key", KeyCode>;
export type BoolConfigDefinitionType = ConfigDefinitionTypeBase<"bool", boolean>;
export type NumberConfigDefinitionType = ConfigDefinitionTypeBase<
	"number",
	number,
	{
		readonly min: number;
		readonly max: number;
		readonly step: number;
	}
>;

export type ConfigDefinitionType = KeyConfigDefinitionType & BoolConfigDefinitionType & NumberConfigDefinitionType;
export type ConfigDefinition = ConfigDefinitionType[keyof ConfigDefinitionType];

export type ConfigDefinitions = Readonly<Record<string, ConfigDefinition>>;

export type ConfigValueType = keyof ConfigDefinitionType;
export type ConfigValueTypes = Readonly<Record<string, ConfigValueType>>;

export type ConfigValueOf<T extends ConfigDefinition> = T["default"]["Desktop"];
export type ConfigValue = ConfigValueOf<ConfigDefinition>;
export type ConfigValues = Readonly<Record<string, ConfigValue>>;

export type ConfigTypesToConfig<T extends ConfigValueTypes> = {
	[k in keyof T]: ConfigValueOf<ConfigDefinitionType[T[k]]>;
};

export type ConfigTypesToDefinition<T extends ConfigValueTypes> = {
	readonly [k in keyof T]: ConfigDefinitionType[T[k]];
};
