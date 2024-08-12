import { ServerPlayers } from "server/ServerPlayers";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { BidirectionalRemoteEvent } from "shared/event/PERemoteEvent";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { CreatableRemoteEvents } from "shared/event/RemoteEventBase";

@injectable
abstract class ServerEffectBase<T> {
	@inject private readonly playerDatabase: PlayerDatabase = undefined!;

	protected readonly event;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.event = new BidirectionalRemoteEvent<T>(name, eventType);

		this.event.c2s.invoked.Connect((owner, arg) => {
			let players = ServerPlayers.GetLoadedPlayers().filter((p) => p !== owner);
			if (this.playerDatabase) {
				players = players.filter(
					(p) =>
						this.playerDatabase!.get(p.UserId).settings?.graphics?.othersEffects ??
						PlayerConfigDefinition.graphics.config.othersEffects,
				);
			}

			this.event.s2c.send(players, arg);
		});
	}

	protected abstract justRun(arg: T): void;

	send(ownerPart: BasePart, arg: T): void {
		const owner = ownerPart.GetNetworkOwner();
		let players = ServerPlayers.GetLoadedPlayers();

		if (this.playerDatabase) {
			players = players.filter(
				(p) =>
					p === owner ||
					(this.playerDatabase!.get(p.UserId).settings?.graphics?.othersEffects ??
						PlayerConfigDefinition.graphics.config.othersEffects),
			);
		}

		this.event.s2c.send(players, arg);
	}
}
export { ServerEffectBase as EffectBase };
