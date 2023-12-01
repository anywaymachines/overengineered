type DefaultValue<T> = Readonly<{ Desktop: T } & Partial<Record<InputType, T>>>;
type ConfigValues = ConfigDefinition["default"]["Desktop"];

type KeyConfigDefinition = {
	type: "Key";
	default: DefaultValue<Enum.KeyCode>;
};
type NumberConfigDefinition = {
	type: "Number";
	default: DefaultValue<number>;
	min: number;
	max: number;
	step: number;
};
type BooleanConfigDefinition = {
	type: "Bool";
	default: DefaultValue<boolean>;
};

type BaseConfigDefinitions = KeyConfigDefinition | NumberConfigDefinition | BooleanConfigDefinition;
type ConfigDefinition = Readonly<{ id: string; displayName: string } & BaseConfigDefinitions>;

interface ConfigurableBlock {
	getConfigDefinitions(): Record<string, ConfigDefinition>;
}
