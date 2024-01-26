import { Players } from "@rbxts/services";
import PlayerDatabase from "server/PlayerDatabase";
import GameDefinitions from "shared/GameDefinitions";
import { _UnreliableRemoteEvent } from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";

export default abstract class ServerEffectBase<T> {
	protected readonly remote: _UnreliableRemoteEvent<(part: BasePart, args: T) => void>;

	constructor(createRemote: _UnreliableRemoteEvent<(part: BasePart, args: T) => void>) {
		this.remote = createRemote;

		this.listenPlayers();
	}

	protected listenPlayers() {
		this.remote.OnServerEvent.Connect((player, part, arg) => this.redirect(player, part, false, arg));
	}

	// TODO: Move away
	private isGFXEnabledForPlayer(player: Player): boolean {
		return (
			PlayerDatabase.instance.get(tostring(player.UserId)).settings?.others_gfx ??
			GameDefinitions.PLAYER_SETTINGS_DEFINITION.others_gfx.default
		);
	}

	protected redirect(player: Player, part: BasePart, share: boolean, arg: T) {
		if (!BlockManager.isActiveBlockPart(part)) {
			return;
		}

		if (part.GetNetworkOwner() !== player) {
			return;
		}

		Players.GetPlayers().forEach((plr) => {
			if (player === plr) return;

			if (this.isGFXEnabledForPlayer(plr)) {
				this.remote.FireClient(plr, part, arg);
			}
		});
	}

	/** Creating an effect on the client side and sending it to the server so that other clients can see the effect */
	public create(part: BasePart, forcePlayer: Player | "everyone", arg: T): void {
		Players.GetPlayers().forEach((plr) => {
			if (forcePlayer === "everyone" || forcePlayer === plr || this.isGFXEnabledForPlayer(plr)) {
				this.remote.FireClient(plr, part, arg);
			}
		});
	}
}
