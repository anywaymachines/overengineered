type DefaultValue<T> = Readonly<{ Desktop: T } & Partial<Record<InputType, T>>>;
type ConfigValues = ConfigDefinition["default"]["Desktop"];

type ConfigDefinition = Readonly<
	{ id: string; displayName: string } & (
		| {
				type: "Key";
				default: DefaultValue<Enum.KeyCode>;
		  }
		| {
				type: "Number";
				default: DefaultValue<number>;
				min: number;
				max: number;
				step: number;
		  }
		| {
				type: "Bool";
				default: DefaultValue<boolean>;
		  }
	)
>;

interface ConfigurableBlock {
	getConfigDefinitions(): ConfigDefinition[];
}
