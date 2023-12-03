import { Players } from "@rbxts/services";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import BuildMode from "server/modes/BuildMode";
import PlayModeBase from "server/modes/PlayModeBase";
import RideMode from "server/modes/RideMode";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class SetPlayModeRemoteHandler extends BaseRemoteHandler {
	private readonly playerModes: Record<number, PlayModes | undefined> = {};
	private readonly modes = new Map<PlayModes, PlayModeBase>();

	constructor() {
		super("playMode => set");

		this.modes.set("ride", new RideMode());
		this.modes.set("build", new BuildMode());

		Players.PlayerRemoving.Connect((plr) => delete this.playerModes[plr.UserId]);
		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect((character) => {
				const response = this.emit(plr, "build");
				if (!response.success) print(response.message);

				(character.WaitForChild("Humanoid") as Humanoid).Died.Once(() => {
					const response = this.emit(plr, undefined);
					if (!response.success) print(response.message);
				});
			});
		});

		Remotes.Server.GetNamespace("Ride").OnFunction("SetPlayMode", (player, mode) => this.emit(player, mode));
	}

	public emit(player: Player, mode: PlayModes | undefined): Response {
		if (mode !== undefined && !PlayerUtils.isAlive(player)) {
			return { success: false, message: "Player is not alive" };
		}

		const prevmode = this.playerModes[player.UserId];
		if (prevmode) {
			const transition = this.modes.get(prevmode);
			if (transition) {
				const result = transition.onTransitionTo(player, mode);
				if (!result || !result.success)
					return result ?? { success: false, message: `Invalid play mode transition ${prevmode} => ${mode}` };
			}
		}
		if (mode) {
			const transition = this.modes.get(mode);
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
