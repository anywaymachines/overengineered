type ConfigType<TName extends string, TValue> = {
	readonly type: TName;
	readonly config: TValue;
	readonly displayName: string;
};

//

type UnknownConfigType = ConfigType<string, unknown>;
type UnknownConfigTypes<TKeys extends string | number | symbol = string> = Readonly<
	Record<TKeys, ConfigType<string, unknown>>
>;
type UnknownConfigDefinition = ConfigTypeToDefinition<UnknownConfigType>;
type UnknownConfigDefinitions<TKeys extends string | number | symbol = string> = ConfigTypesToDefinition<
	TKeys,
	UnknownConfigTypes<TKeys>
>;

//

type ConfigTypeToDefinition<TDef extends UnknownConfigType> = TDef;
type ConfigTypesToDefinition<TKeys extends string | number | symbol, TDef extends UnknownConfigTypes<TKeys>> = {
	readonly [k in string]: ConfigTypeToDefinition<TDef[keyof TDef]>;
};

type ConfigDefinitionToConfig<TDef extends UnknownConfigType> = TDef["config"];
type ConfigDefinitionsToConfig<TKeys extends string | number | symbol, TDef extends UnknownConfigDefinitions<TKeys>> = {
	readonly [k in keyof TDef]: ConfigDefinitionToConfig<TDef[k]>;
};
