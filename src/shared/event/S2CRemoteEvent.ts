import { Players, RunService } from "@rbxts/services";
import { SlimSignal } from "shared/event/SlimSignal";
import { CreatableRemoteEvents, RemoteEventBase } from "./RemoteEventBase";

type CustomRemoteEvent<T extends Callback> = Instance & {
	readonly OnServerEvent: RBXScriptSignal<
		(player: Player, ...args: [...Parameters<T>, forcePlayers: readonly Player[] | "everyone"]) => ReturnType<T>
	>;
	readonly OnClientEvent: RBXScriptSignal<T>;

	FireServer(...args: [...Parameters<T>, forcePlayers: readonly Player[] | "everyone"]): void;
	FireClient(player: Player, ...args: Parameters<T>): void;
};

/** Event which:
 * On client, runs and sends it to all specified clients;
 * On server, sends it to all specified clients.
 */
export abstract class S2CRemoteEvent<T> extends RemoteEventBase<TweenInfo, CustomRemoteEvent<(arg: T) => void>> {
	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, arg, players) => {
				this.sendToPlayers(player, players, arg);
			});
		}
		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((arg) => {
				this.justRun(arg);
			});
		}
	}

	protected abstract justRun(arg: T): void;

	sendToNetworkOwnerOrEveryone(part: BasePart | undefined, arg: T) {
		if (!part) return; // TODO: idk whats the best action

		const owner = RunService.IsServer() ? part.GetNetworkOwner() : Players.LocalPlayer;
		this.send(owner ? [owner] : "everyone", arg);
	}

	protected mustSendToPlayer(player: Player): boolean {
		return false;
	}
	send(players: readonly Player[] | "everyone", arg: T) {
		if (RunService.IsClient()) {
			this.justRun(arg);
			this.event.FireServer(arg, players);
		}

		if (RunService.IsServer()) {
			this.sendToPlayers(undefined, players, arg);
		}
	}

	private sendToPlayers(player: Player | undefined, players: readonly Player[] | "everyone", arg: T) {
		for (const plr of Players.GetPlayers()) {
			if (plr === player) continue;
			if (players !== "everyone" && !players.includes(plr) && !this.mustSendToPlayer(plr)) continue;

			this.event.FireClient(plr, arg);
		}
	}
}
export class AutoS2CRemoteEvent<T> extends S2CRemoteEvent<T> {
	readonly invoked = new SlimSignal<(arg: T) => void>();

	justRun(arg: T): void {
		this.invoked.Fire(arg);
	}
}
