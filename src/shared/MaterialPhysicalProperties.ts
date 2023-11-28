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
		Default: {
			Friction: 0.1,
			FrictionWeight: 10,
		},
		Ice: {
			Friction: 0.02,
			FrictionWeight: 50,
		},
	};
}
