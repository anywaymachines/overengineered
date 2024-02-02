import { RunService } from "@rbxts/services";
import SlimSignal from "shared/event/SlimSignal";
import RemoteEventBase, { CreatableRemoteEvents } from "./RemoteEventBase";

type CustomRemoteEvent<T extends Callback> = Instance & {
	readonly OnServerEvent: RBXScriptSignal<(player: Player, ...args: Parameters<T>) => ReturnType<T>>;
	readonly OnClientEvent: RBXScriptSignal<T>;

	FireServer(...args: Parameters<T>): void;
	FireClient(player: Player, ...args: Parameters<T>): void;
};

/** Event which if invoked:
 * On client, sends it to the server;
 * On server, runs it.
 */
export default abstract class C2SRemoteEvent<T> extends RemoteEventBase<T, CustomRemoteEvent<(arg: T) => void>> {
	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, arg) => {
				this.justRun(player, arg);
			});
		}
	}

	abstract justRun(player: Player | undefined, arg: T): void;

	send(arg: T) {
		if (RunService.IsClient()) {
			this.event.FireServer(arg);
		}
		if (RunService.IsServer()) {
			this.justRun(undefined, arg);
		}
	}
}
export class AutoC2SRemoteEvent<T> extends C2SRemoteEvent<T> {
	readonly invoked = new SlimSignal<(player: Player | undefined, arg: T) => void>();

	justRun(player: Player | undefined, arg: T): void {
		this.invoked.Fire(player, arg);
	}
}
