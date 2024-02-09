import RobloxUnit from "shared/RobloxUnit";

const GameDefinitions = {
	GROUP: 1088368,
	RANKS: {
		255: {
			name: "UNREAL",
			color: Color3.fromRGB(0, 0, 0),
		},
		254: {
			name: "Developer",
			rainbow: true,
		},
		2: {
			name: "Game Test",
			color: Color3.fromRGB(170, 255, 255),
		},
	} as { readonly [rank: number]: { name: string; color?: Color3; rainbow?: boolean } },

	// Building
	FREE_SLOTS: 10,
	ADMIN_SLOTS: 50,
	BUILD_HEIGHT_LIMIT: 400,

	MAX_LINEAR_SPEED: RobloxUnit.Meters_To_Studs(1000),
	MAX_ANGULAR_SPEED: 40,

	isAdmin(player: Player) {
		return player.IsInGroup(GameDefinitions.GROUP) && player.GetRankInGroup(GameDefinitions.GROUP) > 250;
	},

	getMaxSlots(player: Player, additional: number) {
		let max = this.FREE_SLOTS + additional;
		if (this.isAdmin(player)) max += this.ADMIN_SLOTS;

		return max;
	},
} as const;
export default GameDefinitions;
