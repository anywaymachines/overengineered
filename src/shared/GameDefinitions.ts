export default class GameDefinitions {
	static readonly GROUP = 1088368 as const;

	// Building
	static readonly FREE_SLOTS = 10 as const;
	static readonly BUILD_HEIGHT_LIMIT = 100 as const;

	static readonly PLAYER_SETTINGS_DEFINITION = {
		betterCamera: {
			displayName: "Better camera",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
	} as const satisfies ConfigDefinitions;
}
