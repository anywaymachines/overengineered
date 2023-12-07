import { Players } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import PlayerUtils from "shared/utils/PlayerUtils";
import BuildMode from "./BuildMode";
import PlayModeBase from "./PlayModeBase";
import RideMode from "./RideMode";

export default class PlayModeController {
	private static readonly playerModes: Record<number, PlayModes | undefined> = {};
	private static readonly modes = {
		ride: new RideMode(),
		build: new BuildMode(),
	} as const satisfies Record<PlayModes, PlayModeBase>;

	static init() {
		Players.PlayerRemoving.Connect((plr) => {
			delete this.playerModes[plr.UserId];
		});

		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect((character) => {
				const response = this.changeModeForPlayer(plr, "build");
				if (!response.success) print(response.message);

				(character.WaitForChild("Humanoid") as Humanoid).Died.Once(() => {
					const response = this.changeModeForPlayer(plr, undefined);
					if (!response.success) print(response.message);
				});
			});
		});
	}

	static changeModeForPlayer(player: Player, mode: PlayModes | undefined): Response {
		if (mode !== undefined && !PlayerUtils.isAlive(player)) {
			return { success: false, message: "Player is not alive" };
		}

		const prevmode = this.playerModes[player.UserId];
		if (prevmode) {
			const transition = this.modes[prevmode];
			if (transition) {
				const result = transition.onTransitionTo(player, mode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}
		if (mode) {
			const transition = this.modes[mode];
			if (transition) {
				const result = transition.onTransitionFrom(player, prevmode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}

		Logger.info(`${player.Name}'s mode: '${this.playerModes[player.UserId]}' => '${mode}'`);
		this.playerModes[player.UserId] = mode;
		Remotes.Server.GetNamespace("Ride").Get("SetPlayModeOnClient").CallPlayerAsync(player, mode);
		return { success: true };
	}
}
