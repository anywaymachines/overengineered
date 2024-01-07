type DefinitionInfo = {
	actual: ConfigValueType;
};

const create = <const TName extends string, const TInfo extends DefinitionInfo>(name: TName, info: TInfo) => {
	return {
		[name]: {
			...info,
			name,
		},
	} as { readonly [k in TName]: typeof info & { name: TName } };
};

export const outputBlockLogicConfigTypeRegistry = {
	...create("bool", {
		actual: "bool",
	}),
	...create("number", {
		actual: "number",
	}),
	...create("key", {
		actual: "key",
	}),
} as const satisfies Record<string, DefinitionInfo>;

const blockLogicConfigTypeRegistry = {
	...outputBlockLogicConfigTypeRegistry,
} as const satisfies Record<string, DefinitionInfo>;

export default blockLogicConfigTypeRegistry;

export type BlockLogicConfigTypes = {
	readonly [k in keyof typeof blockLogicConfigTypeRegistry]: (typeof blockLogicConfigTypeRegistry)[k] &
		ConfigDefinitionType[(typeof blockLogicConfigTypeRegistry)[k]["actual"]];
};

export type BlockLogicConfigDefinition = BlockLogicConfigTypes[keyof BlockLogicConfigTypes];
export type BlockLogicConfigDefinitions = Readonly<Record<string, BlockLogicConfigDefinition>>;
