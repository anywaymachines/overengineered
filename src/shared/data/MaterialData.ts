export type PhysicalProperties = {
	readonly [key: string]: {
		readonly Density?: number;
		readonly Elasticity?: number;
		readonly ElasticityWeight?: number;
		readonly Friction?: number;
		readonly FrictionWeight?: number;
	};
};

const MaterialData = {
	Properties: {
		Default: {},
		Ice: {
			Friction: 0.02,
			FrictionWeight: 50,
		},
	} as PhysicalProperties,
} as const;
export default MaterialData;
