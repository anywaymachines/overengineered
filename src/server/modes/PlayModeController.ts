import { Players } from "@rbxts/services";
import { BuildMode } from "server/modes/BuildMode";
import { RideMode } from "server/modes/RideMode";
import { Remotes } from "shared/Remotes";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import type { PlayModeBase } from "server/modes/PlayModeBase";

export namespace PlayModeController {
	const playerModes: Record<number, PlayModes | undefined> = {};
	const modes = {
		ride: new RideMode(),
		build: new BuildMode(PlayModeController),
	} as const satisfies Record<PlayModes, PlayModeBase>;

	export function init() {
		Players.PlayerRemoving.Connect((plr) => {
			delete playerModes[plr.UserId];
		});
	}

	export function getPlayerMode(player: Player) {
		return playerModes[player.UserId];
	}

	export async function changeModeForPlayer(player: Player, mode: PlayModes | undefined): Promise<Response> {
		if (mode !== undefined && !PlayerUtils.isAlive(player)) {
			return { success: false, message: "Player is not alive" };
		}

		const prevmode = playerModes[player.UserId];
		if (prevmode) {
			const transition = modes[prevmode];
			if (transition) {
				const result = transition.onTransitionTo(player, mode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}
		if (mode) {
			const transition = modes[mode];
			if (transition) {
				const result = transition.onTransitionFrom(player, prevmode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}

		$log(`${player.Name}'s mode: '${playerModes[player.UserId]}' => '${mode}'`);
		playerModes[player.UserId] = mode;

		for (let i = 0; i < 3; i++) {
			try {
				if (!Players.GetPlayers().includes(player)) {
					return { success: true };
				}

				await Remotes.Server.GetNamespace("Ride").Get("SetPlayModeOnClient").CallPlayerAsync(player, mode);
				break;
			} catch (err) {
				//
			}
		}

		return { success: true };
	}
}
