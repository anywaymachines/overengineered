export default class MotorBlock {
	getConfigDefinitions() {
		return {
			rotate_add: {
				id: "rotate_add",
				displayName: "Rotate +",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.R,
					Gamepad: Enum.KeyCode.ButtonR1,
				},
			},
			rotate_sub: {
				id: "rotate_sub",
				displayName: "Rotate -",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.F,
					Gamepad: Enum.KeyCode.ButtonL1,
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
