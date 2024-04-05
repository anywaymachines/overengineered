type PhysicalProperties = {
	readonly [key: string]: {
		readonly Density?: number;
		readonly Elasticity?: number;
		readonly ElasticityWeight?: number;
		readonly Friction?: number;
		readonly FrictionWeight?: number;
	};
};

export namespace MaterialData {
	export const Properties: PhysicalProperties = {
		Default: {},
		Ice: {
			Friction: 0.02,
			FrictionWeight: 50,
		},
	};
}
