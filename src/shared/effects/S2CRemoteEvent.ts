import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import SlimSignal from "shared/event/SlimSignal";

type _UnreliableRemoteEvent<T extends Callback> = Omit<
	UnreliableRemoteEvent<T>,
	"OnServerEvent" | "OnClientEvent" | "FireServer"
> & {
	readonly OnServerEvent: RBXScriptSignal<
		(player: Player, ...args: [...Parameters<T>, forcePlayers: readonly Player[] | "everyone"]) => ReturnType<T>
	>;
	readonly OnClientEvent: RBXScriptSignal<T>;

	FireServer(...args: [...Parameters<T>, forcePlayers: readonly Player[] | "everyone"]): void;
	FireClient(player: Player, ...args: [...Parameters<T>, forcePlayers: readonly Player[] | "everyone"]): void;
};

/** Event which:
 * On client, runs and sends it to all specified clients;
 * On server, sends it to all specified clients.
 */
export default abstract class S2CRemoteEvent<T> {
	readonly invoked = new SlimSignal<(arg: T) => void>();
	readonly event: _UnreliableRemoteEvent<(arg: T) => void>;

	constructor(name: string);
	constructor(event: _UnreliableRemoteEvent<(arg: T) => void>);
	constructor(event: string | _UnreliableRemoteEvent<(arg: T) => void>) {
		if (typeIs(event, "string")) {
			if (RunService.IsServer()) {
				const name = event;
				event = new Instance("UnreliableRemoteEvent");
				event.Name = name;
				event.Parent = ReplicatedStorage;
			} else {
				event = ReplicatedStorage.WaitForChild(event) as UnreliableRemoteEvent;
			}
		}

		this.event = event;

		if (RunService.IsClient()) {
			event.OnClientEvent.Connect((arg) => this.justRun(arg));
		}
	}

	abstract justRun(arg: T): void;

	send(players: readonly Player[] | "everyone", arg: T) {
		if (RunService.IsClient()) {
			this.justRun(arg);
			this.event.FireServer(arg, players);
		}

		if (RunService.IsServer()) {
			const player = Players.LocalPlayer;
			for (const plr of players === "everyone" ? Players.GetPlayers() : players) {
				if (plr === player) continue;
				if (players !== "everyone" && !players.includes(plr)) continue;

				this.event.FireClient(plr, arg);
			}
		}
	}
}
