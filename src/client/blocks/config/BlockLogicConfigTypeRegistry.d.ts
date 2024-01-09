type DefinitionInfo = {
	actual: ConfigValueType;
};

type BlockConfigDefinitionTypeBase<
	TKey extends string,
	TActualType,
	TDefinition extends keyof ConfigDefinitionType,
	TAdditional extends {} = {},
> = {
	readonly [k in TKey]: ConfigDefinitionType[TDefinition] & {
		readonly blockConfigType?: TKey;
		readonly blockConfigDefault?: DefaultConfigValue<TActualType>;
	} & TAdditional;
};

type KeyBlockConfigDefinitionType = BlockConfigDefinitionTypeBase<"key", KeyCode, "key">;
type BoolKeyBlockConfigDefinitionType = BlockConfigDefinitionTypeBase<"keyb", KeyCode, "bool">;
type BoolBlockConfigDefinitionType = BlockConfigDefinitionTypeBase<"bool", boolean, "bool">;
type NumberBlockConfigDefinitionType = BlockConfigDefinitionTypeBase<"number", number, "number">;

type BlockConfigDefinitionType = KeyBlockConfigDefinitionType &
	BoolKeyBlockConfigDefinitionType &
	BoolBlockConfigDefinitionType &
	NumberBlockConfigDefinitionType;

type BlockLogicConfigDefinition = BlockConfigDefinitionType[keyof BlockConfigDefinitionType];
type BlockLogicConfigDefinitions = Readonly<Record<string, BlockLogicConfigDefinition>>;
