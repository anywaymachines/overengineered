export default class DisconnectBlock {
	getConfigDefinitions() {
		return {
			disconnect: {
				id: "disconnect",
				displayName: "Disconnect key",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.F,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
			test1: {
				id: "test1",
				displayName: "Test 1",
				type: "Number",
				default: {
					Desktop: 1,
					Gamepad: 1,
				},
				min: 0,
				max: 10,
				step: 1,
			},
			test2: {
				id: "test2",
				displayName: "Test 2",
				type: "Bool",
				default: {
					Desktop: true,
					Gamepad: true,
				},
			},
		} satisfies Record<string, ConfigDefinition>;
	}
}
