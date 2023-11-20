type ConfigDefinition = { displayName: string } & (
	| {
			type: "Key";
			default: {
				Desktop: Enum.KeyCode;
				Gamepad: Enum.KeyCode;
			};
	  }
	| {
			type: "Number";
			default: number;
	  }
	| {
			type: "Bool";
			default: boolean;
	  }
);

interface ConfigurableBlock {
	getConfigDefinitions(): ConfigDefinition[];
}
