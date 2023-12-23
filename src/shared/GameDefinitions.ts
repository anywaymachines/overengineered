import RobloxUnit from "./RobloxUnit";

export default class GameDefinitions {
	static readonly GROUP = 1088368 as const;

	// Building
	static readonly FREE_SLOTS = 10 as const;
	static readonly ADMIN_SLOTS = 50 as const;
	static readonly BUILD_HEIGHT_LIMIT = 400 as const;

	static readonly MAX_LINEAR_SPEED = RobloxUnit.Meters_To_Studs(1000);
	static readonly MAX_ANGULAR_SPEED = 40;

	static readonly PLAYER_SETTINGS_DEFINITION = {
		betterCamera: {
			displayName: "Better camera",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
		music: {
			displayName: "Music",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
		beacons: {
			displayName: "Beacons",
			type: "bool",
			default: {
				Desktop: true,
			},
		},
	} as const satisfies ConfigDefinitions;

	static isAdmin(player: Player) {
		return player.IsInGroup(GameDefinitions.GROUP) && player.GetRankInGroup(GameDefinitions.GROUP) > 250;
	}

	static getMaxSlots(player: Player, additional: number) {
		let max = this.FREE_SLOTS + additional;
		if (this.isAdmin(player)) max += this.ADMIN_SLOTS;

		return max;
	}
}
