export default class SmallRocketEngineBlock {
	getConfigDefinitions() {
		return {
			thrust_add: {
				id: "thrust_add",
				displayName: "Thrust +",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.W,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
			thrust_sub: {
				id: "thrust_sub",
				displayName: "Thrust -",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.S,
					Gamepad: Enum.KeyCode.ButtonL2,
				},
			},
			switchmode: {
				id: "switchmode",
				displayName: "Switch Mode",
				type: "Bool",
				default: {
					Desktop: false,
					Gamepad: false,
				},
			},
			strength: {
				id: "strength",
				displayName: "Strength %",
				type: "Number",
				min: 0,
				max: 100,
				step: 1,
				default: {
					Desktop: 100,
				},
			},
		} satisfies Record<string, ConfigDefinition>;
	}
}
