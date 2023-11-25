type ConfigDefinition = Readonly<
	{ id: string; displayName: string } & (
		| {
				type: "Key";
				default: { Desktop: number } & Readonly<Partial<Record<InputType, number>>>;
		  }
		| {
				type: "Number";
				default: { Desktop: number } & Readonly<Partial<Record<InputType, number>>>;
				min: number;
				max: number;
				step: number;
		  }
		| {
				type: "Bool";
				default: { Desktop: boolean } & Readonly<Partial<Record<InputType, boolean>>>;
		  }
	)
>;

interface ConfigurableBlock {
	getConfigDefinitions(): ConfigDefinition[];
}
