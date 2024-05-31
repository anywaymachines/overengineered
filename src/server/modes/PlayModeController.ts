import { Players } from "@rbxts/services";
import { BuildMode } from "server/modes/BuildMode";
import { RideMode } from "server/modes/RideMode";
import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { PlayerWatcher } from "server/PlayerWatcher";
import { HostedService } from "shared/GameHost";
import { Remotes } from "shared/Remotes";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import type { PlayModeBase } from "server/modes/PlayModeBase";

@injectable
export class PlayModeController extends HostedService {
	static initialize(host: GameHostBuilder) {
		host.services.registerSingletonClass(RideMode);
		host.services.registerSingletonClass(BuildMode);
		host.services.registerService(this);
	}

	private readonly playerModes: Record<number, PlayModes | undefined> = {};
	private readonly modes;

	constructor(@inject ride: RideMode, @inject build: BuildMode) {
		super();

		this.modes = {
			ride,
			build,
		} as const satisfies Record<PlayModes, PlayModeBase>;

		registerOnRemoteFunction("Ride", "SetPlayMode", this.changeModeForPlayer.bind(this));

		Players.PlayerRemoving.Connect((plr) => {
			delete this.playerModes[plr.UserId];
		});

		const setBuildMode = async (plr: Player, character: Model) => {
			// on spawn
			const response = await this.changeModeForPlayer(plr, "build");
			if (!response.success) $err(response.message);

			// on death
			(character.WaitForChild("Humanoid") as Humanoid).Died.Once(async () => {
				const prev = this.getPlayerMode(plr);
				if (prev !== "build" && prev !== undefined) return;

				const response = await this.changeModeForPlayer(plr, undefined);
				if (!response.success) $err(response.message);
			});
		};
		PlayerWatcher.onJoin((plr) => {
			const char = plr.Character;
			if (char) setBuildMode(plr, char);

			plr.CharacterAdded.Connect((char) => setBuildMode(plr, char));
		});
	}

	getPlayerMode(player: Player) {
		return this.playerModes[player.UserId];
	}

	async changeModeForPlayer(player: Player, mode: PlayModes | undefined): Promise<Response> {
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

		$log(`${player.Name}'s mode: '${this.playerModes[player.UserId]}' => '${mode}'`);
		this.playerModes[player.UserId] = mode;

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
