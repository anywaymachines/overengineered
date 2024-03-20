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

	GAMEPASSES: {
		NeonMaterial: 748518813,
	},

	// Building
	FREE_SLOTS: 15,
	ADMIN_SLOTS: 50,

	MAX_LINEAR_SPEED: RobloxUnit.Meters_To_Studs(1000),
	MAX_ANGULAR_SPEED: 40,

	isAdmin(player: Player) {
		if (player.Name === "i3ymm" || player.Name === "3QAXM" || player.Name === "samlovebutter") return true;

		let err: string | undefined;
		for (let i = 0; i < 3; i++) {
			try {
				return player.GetRankInGroup(GameDefinitions.GROUP) > 250;
			} catch (error) {
				// eslint-disable-next-line no-ex-assign
				error = err;
				task.wait(1 + i);
			}
		}

		return false;
	},

	getMaxSlots(player: Player, additional: number) {
		let max = this.FREE_SLOTS + additional;
		if (this.isAdmin(player)) max += this.ADMIN_SLOTS;

		return max;
	},
} as const;
export default GameDefinitions;
