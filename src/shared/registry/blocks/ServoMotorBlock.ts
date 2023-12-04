export default class MotorBlock {
	getConfigDefinitions() {
		return {
			rotate_add: {
				id: "rotate_add",
				displayName: "Rotate +",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.Q,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
			rotate_sub: {
				id: "rotate_sub",
				displayName: "Rotate -",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.E,
					Gamepad: Enum.KeyCode.ButtonL2,
				},
			},
			speed: {
				id: "speed",
				displayName: "Max. speed",
				type: "Number",
				min: 0,
				max: 50,
				step: 1,
				default: {
					Desktop: 15,
				},
			},
			angle: {
				id: "angle",
				displayName: "Angle",
				type: "Number",
				min: -180,
				max: 180,
				step: 1,
				default: {
					Desktop: 45,
				},
			},
			switch: {
				id: "switch",
				displayName: "Switch",
				type: "Bool",
				default: {
					Desktop: false,
				},
			},
		} satisfies Record<string, ConfigDefinition>;
	}
}
