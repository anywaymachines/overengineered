type ConfigDefinition = Readonly<
	{ id: string; displayName: string } & (
		| {
				type: "Key";
				default: { Desktop: number } & Readonly<Record<InputType, number>>;
		  }
		| {
				type: "Number";
				default: { Desktop: number } & Readonly<Record<InputType, number>>;
				min: number;
				max: number;
				step: number;
		  }
		| {
				type: "Bool";
				default: { Desktop: boolean } & Readonly<Record<InputType, boolean>>;
		  }
	)
>;

interface ConfigurableBlock {
	getConfigDefinitions(): ConfigDefinition[];
}
