import { HttpService, Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { ArgsSignal } from "shared/event/Signal";

export type CreatableRemoteEvents = "UnreliableRemoteEvent" | "RemoteEvent";

export type CustomRemoteEventBase<TArgsToClient extends unknown[], TArgsToServer extends unknown[]> = Instance & {
	/** @server */
	readonly OnServerEvent: RBXScriptSignal<(player: Player, ...args: TArgsToServer) => void>;
	/** @client */
	readonly OnClientEvent: RBXScriptSignal<(...args: TArgsToClient) => void>;

	/** @client */
	FireServer(...args: TArgsToServer): void;
	/** @server */
	FireClient(player: Player, ...args: TArgsToClient): void;
};
export type CustomRemoteEvent<TArgs extends unknown[]> = CustomRemoteEventBase<TArgs, TArgs>;

export class PERemoveEvent<TEvent extends Instance> {
	protected readonly event: TEvent;

	constructor(name: string, eventType: CreatableRemoteEvents) {
		if (RunService.IsServer()) {
			if (ReplicatedStorage.FindFirstChild(name)) {
				throw `${eventType} ${name} already exists.`;
			}

			this.event = new Instance(eventType) as unknown as TEvent;
			this.event.Name = name;
			this.event.Parent = ReplicatedStorage;
		} else {
			this.event = ReplicatedStorage.WaitForChild(name) as TEvent;
		}
	}
}

class C2SRemoteEvent<TArgs extends unknown[]> extends PERemoveEvent<CustomRemoteEvent<TArgs>> {
	readonly invoked = new ArgsSignal<[player: Player, ...args: TArgs]>();

	constructor(name: string, eventType: CreatableRemoteEvents) {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, ...args) => this.invoked.Fire(player, ...args));
		}
	}

	/** @client */
	send(...args: TArgs) {
		this.event.FireServer(...args);
	}
}

class S2CRemoteEvent<TArgs extends unknown[]> extends PERemoveEvent<CustomRemoteEvent<TArgs>> {
	readonly invoked = new ArgsSignal<TArgs>();

	constructor(name: string, eventType: CreatableRemoteEvents) {
		super(name, eventType);

		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((...args) => this.invoked.Fire(...args));
		}
	}

	/** @server */
	send(players: Player | readonly Player[] | "everyone", ...args: TArgs) {
		if (typeIs(players, "Instance")) {
			this.event.FireClient(players, ...args);
		} else if (players === "everyone") {
			for (const player of Players.GetPlayers()) {
				this.event.FireClient(player, ...args);
			}
		} else {
			for (const player of players) {
				this.event.FireClient(player, ...args);
			}
		}
	}
}

const createWaiter = <TRet>(timeout?: number) => {
	let result: TRet | undefined = undefined;
	let completed = false;
	const time = os.time();

	return $tuple(
		(ret: TRet) => {
			result = ret;
			completed = true;
		},
		() => {
			// bad spinlock, maybe replace with something
			while (true as boolean) {
				task.wait();

				if (timeout !== undefined && os.time() > time + timeout) {
					return "canceled";
				}

				if (!completed) continue;

				break;
			}

			return { success: true, result };
		},
	);
};

class S2C2SRemoteFunction<TArgs extends unknown[], TRet> extends PERemoveEvent<
	CustomRemoteEventBase<[id: string, ...args: TArgs], [id: string, ret: TRet]>
> {
	private readonly waiting = new Map<string, { player: Player; retfunc: (ret: TRet) => void }>();

	constructor(name: string, eventType: CreatableRemoteEvents) {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, id, ret) => {
				const waiter = this.waiting.get(id);
				if (!waiter) return;

				if (waiter.player !== player) {
					player.Kick("ban forever");
					return;
				}

				this.waiting.delete(id);
				waiter.retfunc(ret);
			});
		}
	}

	/** @server */
	send(player: Player, ...args: TArgs) {
		const id = HttpService.GenerateGUID();
		this.event.FireClient(player, id, ...args);

		const [retfunc, waitfunc] = createWaiter<TRet>();
		this.waiting.set(id, { player, retfunc });

		return waitfunc();
	}
}

class C2S2CRemoteFunction<TArgs extends unknown[], TRet> extends PERemoveEvent<
	CustomRemoteEventBase<[id: string, ret: TRet], [id: string, ...args: TArgs]>
> {
	private readonly waiting = new Map<string, (ret: TRet) => void>();

	constructor(name: string, eventType: CreatableRemoteEvents) {
		super(name, eventType);

		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((id, ret) => {
				const waiter = this.waiting.get(id);
				if (waiter) {
					this.waiting.delete(id);
					waiter(ret);
				}
			});
		}
	}

	/** @client */
	send(...args: TArgs) {
		const id = HttpService.GenerateGUID();
		this.event.FireServer(id, ...args);

		const [retfunc, waitfunc] = createWaiter<TRet>();
		this.waiting.set(id, retfunc);

		return waitfunc();
	}
}
