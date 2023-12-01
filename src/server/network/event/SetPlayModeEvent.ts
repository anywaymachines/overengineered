import { Players } from "@rbxts/services";
import SlotsDatabase from "server/SlotsDatabase";
import BuildMode from "server/modes/BuildMode";
import PlayModeBase from "server/modes/PlayModeBase";
import RideMode from "server/modes/RideMode";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class SetPlayModeEvent {
	private static readonly playerModes: Record<number, PlayModes | undefined> = {};
	private static readonly modes = new Map<PlayModes, PlayModeBase>();

	static initialize(): void {
		Logger.info("Loading SetPlayModeEvent event listener...");

		this.modes.set("ride", new RideMode());
		this.modes.set("build", new BuildMode());

		Players.PlayerRemoving.Connect((plr) => delete this.playerModes[plr.UserId]);
		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect((character) => {
				const response = this.setMode(plr, "build");
				if (!response.success) print(response.message);

				(character.WaitForChild("Humanoid") as Humanoid).Died.Connect(() => {
					const response = this.setMode(plr, undefined);
					if (!response.success) print(response.message);
				});
			});
		});

		Remotes.Server.GetNamespace("Ride").OnFunction("SetPlayMode", (player, mode) => this.setMode(player, mode));
	}

	private static setMode(player: Player, mode: PlayModes | undefined): Response {
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

		print("Player " + player.UserId + " changed his mode from " + this.playerModes[player.UserId] + " to " + mode);
		this.playerModes[player.UserId] = mode;
		Remotes.Server.GetNamespace("Ride").Get("SetPlayModeOnClient").CallPlayerAsync(player, mode);
		return { success: true };
	}
}
