const disconnectblock = {
	disconnect: {
		displayName: "Disconnect key",
		type: "key",
		default: {
			Desktop: "F",
			Gamepad: "ButtonR2",
		},
	},
} as const satisfies ConfigDefinitions;

const motorblock = {
	rotate_add: {
		displayName: "Rotate +",
		type: "key",
		default: {
			Desktop: "R",
			Gamepad: "ButtonR1",
		},
	},
	rotate_sub: {
		displayName: "Rotate -",
		type: "key",
		default: {
			Desktop: "F",
			Gamepad: "ButtonL1",
		},
	},
	speed: {
		displayName: "Max. speed",
		type: "number",
		min: 0,
		max: 50,
		step: 1,
		default: {
			Desktop: 15,
		},
	},
	switch: {
		displayName: "Switch",
		type: "bool",
		default: {
			Desktop: false,
		},
	},
} as const satisfies ConfigDefinitions;

const smallrocketengine = {
	thrust_add: {
		displayName: "Thrust +",
		type: "key",
		default: {
			Desktop: "W",
			Gamepad: "ButtonR2",
		},
	},
	thrust_sub: {
		displayName: "Thrust -",
		type: "key",
		default: {
			Desktop: "S",
			Gamepad: "ButtonL2",
		},
	},
	switchmode: {
		displayName: "Toggle Mode",
		type: "bool",
		default: {
			Desktop: false,
			Gamepad: false,
		},
	},
	strength: {
		displayName: "Strength %",
		type: "number",
		min: 0,
		max: 100,
		step: 1,
		default: {
			Desktop: 100,
		},
	},
} as const satisfies ConfigDefinitions;

const rope = {
	length: {
		displayName: "Length",
		type: "number",
		min: 2,
		max: 50,
		step: 1,
		default: {
			Desktop: 15,
		},
	},
} as const satisfies ConfigDefinitions;

const servomotorblock = {
	rotate_add: {
		displayName: "Rotate +",
		type: "key",
		default: {
			Desktop: "Q",
			Gamepad: "ButtonR2",
		},
	},
	rotate_sub: {
		displayName: "Rotate -",
		type: "key",
		default: {
			Desktop: "E",
			Gamepad: "ButtonL2",
		},
	},
	speed: {
		displayName: "Max. speed",
		type: "number",
		min: 0,
		max: 50,
		step: 1,
		default: {
			Desktop: 15,
		},
	},
	angle: {
		displayName: "Angle",
		type: "number",
		min: -180,
		max: 180,
		step: 1,
		default: {
			Desktop: 45,
		},
	},
	switch: {
		displayName: "Switch",
		type: "bool",
		default: {
			Desktop: false,
		},
	},
} as const satisfies ConfigDefinitions;

const tnt = {
	explode: {
		displayName: "Explode",
		type: "key",
		default: {
			Desktop: "B",
			Gamepad: "ButtonR2",
		},
	},
	radius: {
		displayName: "Explosion radius",
		type: "number",
		default: {
			Desktop: 12,
		},
		min: 1,
		max: 12,
		step: 1,
	},
	pressure: {
		displayName: "Explosion pressure",
		type: "number",
		default: {
			Desktop: 2500,
		},
		min: 0,
		max: 2500,
		step: 1,
	},
	flammable: {
		displayName: "Flammable",
		type: "bool",
		default: {
			Desktop: true,
		},
	},
	impact: {
		displayName: "Impact",
		type: "bool",
		default: {
			Desktop: true,
		},
	},
} as const satisfies ConfigDefinitions;

const suspensionblock = {
	damping: {
		displayName: "Damping",
		type: "number",
		default: {
			Desktop: 30,
		},
		min: 0,
		max: 100,
		step: 0.01,
	},
	stiffness: {
		displayName: "Stiffness",
		type: "number",
		default: {
			Desktop: 20,
		},
		min: 0,
		max: 1000,
		step: 0.01,
	},
	free_length: {
		displayName: "Free Length",
		type: "number",
		default: {
			Desktop: 4.5,
		},
		min: 0,
		max: 10,
		step: 0.01,
	},
} as const satisfies ConfigDefinitions;

const blockConfigRegistry = {
	disconnectblock,
	motorblock,
	smallrocketengine,
	rocketengine: smallrocketengine,
	rope,
	servomotorblock,
	tnt,
	suspensionblock,
} as const satisfies Record<string, ConfigDefinitions>;

type RocketEngineConfig = ConfigDefinitionToTypes<typeof blockConfigRegistry.smallrocketengine>;

export default blockConfigRegistry;
