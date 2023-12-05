export default class GameDefinitions {
	static readonly DEVELOPERS = [
		2880942160, // 3QAXM
		5184377367, // mgcode_ru
		5243461283, // i3ymm
	] as readonly number[];

	// Building
	static readonly FREE_SLOTS = 10 as const;
	static readonly BUILD_HEIGHT_LIMIT = 100 as const;

	static readonly PLAYER_SETTINGS_DEFINITION = {
		betterCamera: {
			id: "betterCamera",
			displayName: "Better camera",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
	} as const satisfies ConfigDefinitions;
}
