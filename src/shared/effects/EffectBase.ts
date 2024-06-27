import { Players, RunService } from "@rbxts/services";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { BidirectionalRemoteEvent } from "shared/event/PERemoteEvent";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { CreatableRemoteEvents } from "shared/event/RemoteEventBase";

@injectable
export abstract class EffectBase<T> {
	@inject
	private playerDatabase?: PlayerDatabase;

	private readonly event;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.event = new BidirectionalRemoteEvent<T>(name, eventType);

		if (RunService.IsClient()) {
			this.event.s2c.invoked.Connect((arg) => this.justRun(arg));
		}

		if (RunService.IsServer()) {
			this.event.c2s.invoked.Connect((owner, arg) => {
				let players = Players.GetPlayers().filter((p) => p !== owner);
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
	}

	protected abstract justRun(arg: T): void;

	send(ownerPart: BasePart, arg: T): void {
		if (RunService.IsClient()) {
			this.justRun(arg);
			this.event.c2s.send(arg);
			return;
		}

		const owner = ownerPart.GetNetworkOwner();
		let players = Players.GetPlayers();
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
