import { RobloxUnit } from "shared/RobloxUnit";

export namespace GameDefinitions {
	export const APRIL_FOOLS = false;

	export const GROUP = 1088368;
	export const RANKS = {
		255: {
			name: "UNREAL",
			color: Color3.fromRGB(0, 0, 0),
		},
		254: {
			name: "Developer",
			rainbow: true,
		},
		253: {
			name: "Roblox Staff",
			color: Color3.fromRGB(255, 255, 255),
		},
		3: {
			name: "Tester",
			color: Color3.fromRGB(255, 180, 40),
		},
		2: {
			name: "Pre-Beta 2024",
			color: Color3.fromRGB(118, 249, 249),
		},
	} as { readonly [rank: number]: { name: string; color?: Color3; rainbow?: boolean } };

	export const GAMEPASSES = {
		NeonMaterial: 793888123,
	};

	export const PRODUCTION_PLACE_ID = 17282606569;

	// Building
	export const FREE_SLOTS = 15;
	export const ADMIN_SLOTS = 50;

	export const MAX_LINEAR_SPEED = RobloxUnit.Meters_To_Studs(1000);
	export const MAX_ANGULAR_SPEED = 40;
	export const HEIGHT_OFFSET = -16384;

	export function isAdmin(player: Player) {
		if (player.Name === "i3ymm" || player.Name === "3QAXM" || player.Name === "samlovebutter") return true;

		let err: string | undefined;
		for (let i = 0; i < 3; i++) {
			try {
				return player.GetRankInGroup(GROUP) > 250;
			} catch (error) {
				// eslint-disable-next-line no-ex-assign
				error = err;
				task.wait(1 + i);
			}
		}

		return false;
	}

	export function isRobloxEngineer(player: Player) {
		let err: string | undefined;
		for (let i = 0; i < 3; i++) {
			try {
				return player.IsInGroup(1200769);
			} catch (error) {
				// eslint-disable-next-line no-ex-assign
				error = err;
				task.wait(1 + i);
			}
		}

		return false;
	}

	export function getMaxSlots(player: Player, additional: number) {
		let max = FREE_SLOTS + additional;
		if (isAdmin(player)) max += ADMIN_SLOTS;

		return max;
	}
}
