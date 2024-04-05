import { Players } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { Remotes } from "shared/Remotes";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import { BuildMode } from "./BuildMode";
import { PlayModeBase } from "./PlayModeBase";
import { RideMode } from "./RideMode";

export class PlayModeController {
	private static readonly playerModes: Record<number, PlayModes | undefined> = {};
	private static readonly modes = {
		ride: new RideMode(),
		build: new BuildMode(PlayModeController),
	} as const satisfies Record<PlayModes, PlayModeBase>;

	static init() {
		Players.PlayerRemoving.Connect((plr) => {
			delete this.playerModes[plr.UserId];
		});
	}

	static getPlayerMode(player: Player) {
		return this.playerModes[player.UserId];
	}

	static async changeModeForPlayer(this: void, player: Player, mode: PlayModes | undefined): Promise<Response> {
		if (mode !== undefined && !PlayerUtils.isAlive(player)) {
			return { success: false, message: "Player is not alive" };
		}

		const prevmode = PlayModeController.playerModes[player.UserId];
		if (prevmode) {
			const transition = PlayModeController.modes[prevmode];
			if (transition) {
				const result = transition.onTransitionTo(player, mode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}
		if (mode) {
			const transition = PlayModeController.modes[mode];
			if (transition) {
				const result = transition.onTransitionFrom(player, prevmode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}

		Logger.info(`${player.Name}'s mode: '${PlayModeController.playerModes[player.UserId]}' => '${mode}'`);
		PlayModeController.playerModes[player.UserId] = mode;

		await Remotes.Server.GetNamespace("Ride").Get("SetPlayModeOnClient").CallPlayerAsync(player, mode);
		return { success: true };
	}
}
