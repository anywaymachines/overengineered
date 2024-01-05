export type PhysicalProperties = {
	[key: string]: {
		Density?: number;
		Elasticity?: number;
		ElasticityWeight?: number;
		Friction?: number;
		FrictionWeight?: number;
	};
};

export default class MaterialPhysicalProperties {
	static Properties: PhysicalProperties = {
		Default: {},
		Ice: {
			Friction: 0.02,
			FrictionWeight: 50,
		},
	};
}
