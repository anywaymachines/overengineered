import { ServerPlayers } from "server/ServerPlayers";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { BidirectionalRemoteEvent } from "shared/event/PERemoteEvent";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { CreatableRemoteEvents } from "shared/event/RemoteEventBase";

@injectable
abstract class ServerEffectBase<T> {
	@inject private readonly playerDatabase: PlayerDatabase = undefined!;
	@inject private readonly plots: SharedPlots = undefined!;

	protected readonly event;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.event = new BidirectionalRemoteEvent<T>(name, eventType);

		this.event.c2s.invoked.Connect((owner, arg) => {
			let players = ServerPlayers.GetLoadedPlayers();
			players = players.filter((p) => p !== owner);
			players = players.filter((player) => this.filterPlayer(owner, player));

			this.event.s2c.send(players, arg);
		});
	}

	protected abstract justRun(arg: T): void;

	private filterPlayer(owner: Player | undefined, player: Player): boolean {
		if (player === owner) return true;

		if (owner) {
			const plot = this.plots.getPlotComponentByOwnerID(player.UserId);
			if (plot.blacklistedPlayers.get()?.includes(owner.UserId)) {
				return false;
			}
		}

		const other =
			this.playerDatabase.get(player.UserId).settings?.graphics?.othersEffects ??
			PlayerConfigDefinition.graphics.config.othersEffects;
		if (!other) {
			return false;
		}

		return true;
	}

	send(ownerPart: BasePart, arg: T): void {
		const owner = ownerPart.GetNetworkOwner();
		const players = ServerPlayers.GetLoadedPlayers().filter((player) => this.filterPlayer(owner, player));

		this.event.s2c.send(players, arg);
	}
}
export { ServerEffectBase as EffectBase };
