import { Players, RunService } from "@rbxts/services";
import { RobloxUnit } from "shared/RobloxUnit";
import { Throttler } from "shared/Throttler";

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
			color: Color3.fromRGB(0, 170, 255),
		},
	} as { readonly [rank: number]: { name: string; color?: Color3; rainbow?: boolean } };

	export const GAMEPASSES = {
		NeonMaterial: 793888123,
	};

	export const PRODUCTION_PLACE_ID = 17282606569;
	export const PRODUCTION_UNIVERSE_ID = 5912710468;
	export const INTERNAL_UNIVERSE_ID = 5244408961;

	// Building
	export const FREE_SLOTS = 20;
	export const ADMIN_SLOTS = 65 - FREE_SLOTS;

	export const MAX_LINEAR_SPEED = RobloxUnit.Meters_To_Studs(1000);
	export const MAX_ANGULAR_SPEED = 40;
	export const HEIGHT_OFFSET = -16384;

	export function isAdmin(player: Player): boolean {
		if (player.Name === "i3ymm" || player.Name === "3QAXM" || player.Name === "samlovebutter") return true;

		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.GetRankInGroup(GROUP) > 250);

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function isTestPlace() {
		return game.PlaceId !== PRODUCTION_PLACE_ID;
	}

	export function isRobloxEngineer(player: Player) {
		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.IsInGroup(1200769));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function getMaxSlots(player: Player, additional: number) {
		let max = FREE_SLOTS + additional;
		if (isAdmin(player)) max += ADMIN_SLOTS;

		return max;
	}

	export function getEnvironmentInfo(): readonly string[] {
		const ret = [];

		ret.push(
			`Environment: ${isTestPlace() ? "⚠️ Testing" : "✅ Production"} in ${RunService.IsStudio() ? "studio" : "player"}`,
		);
		ret.push(`User: ${Players.LocalPlayer.UserId} @${Players.LocalPlayer.Name} ${Players.LocalPlayer.DisplayName}`);
		ret.push(`Build: ${RunService.IsStudio() ? "🔒 Studio" : game.PlaceVersion}`);
		ret.push(`Server: ${RunService.IsStudio() ? "🔒 Studio" : game.JobId}`);

		return ret;
	}
}
