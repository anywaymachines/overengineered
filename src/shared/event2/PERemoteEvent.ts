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

abstract class PERemoveEvent<TEvent extends Instance> {
	protected readonly event: TEvent;

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
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

export class BidirectionalRemoteEvent<TArgs extends unknown[] = []> extends PERemoveEvent<CustomRemoteEvent<TArgs>> {
	readonly s2c;
	readonly c2s;

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		this.s2c = new S2CRemoteEvent<TArgs>(name + "_s2c", eventType);
		this.c2s = new C2SRemoteEvent<TArgs>(name + "_c2s", eventType);
	}
}

export class C2SRemoteEvent<TArgs extends unknown[] = []> extends PERemoveEvent<CustomRemoteEvent<TArgs>> {
	/** @server */
	readonly invoked = new ArgsSignal<[player: Player, ...args: TArgs]>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
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

export class S2CRemoteEvent<TArgs extends unknown[] = []> extends PERemoveEvent<CustomRemoteEvent<TArgs>> {
	/** @client */
	readonly invoked = new ArgsSignal<TArgs>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
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

type Canceled = symbol;
const canceled: Canceled = {} as Canceled;
const isCanceled = <T>(cancel: Canceled | T): cancel is Canceled => cancel === canceled;

const createWaiter = <TRet extends Response>(timeout?: number) => {
	let result: TRet | undefined = undefined;
	let completed = false;
	const time = os.time();

	return $tuple(
		(ret: TRet) => {
			result = ret;
			completed = true;
		},
		(): Canceled | TRet => {
			// bad spinlock, maybe replace with something
			while (true as boolean) {
				task.wait();

				if (timeout !== undefined && os.time() > time + timeout) {
					return canceled;
				}

				if (!completed) continue;

				break;
			}

			return result as TRet;
		},
	);
};

export class S2C2SRemoteFunction<TArgs extends unknown[], TResp extends Response = Response> extends PERemoveEvent<
	CustomRemoteEventBase<[id: string, ...args: TArgs], [id: string, ret: TResp]>
> {
	/** @client */
	private invoked?: (...args: TArgs) => TResp;
	private readonly waiting = new Map<string, { player: Player; retfunc: (ret: TResp) => void }>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((id, ...args) => {
				if (!this.invoked) throw `Event ${name} was not subscribed to`;

				const result = this.invoked(...args);
				this.event.FireServer(id, result);
			});
		} else if (RunService.IsServer()) {
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

	/** @client */
	subscribe(func: typeof this.invoked & defined) {
		if (this.invoked) throw "what";
		this.invoked = func;
	}

	/** @server */
	send(player: Player, ...args: TArgs): ErrorResponse | TResp {
		const id = HttpService.GenerateGUID();
		this.event.FireClient(player, id, ...args);

		const [retfunc, waitfunc] = createWaiter<TResp>();
		this.waiting.set(id, { player, retfunc });

		const result = waitfunc();
		if (isCanceled(result)) {
			return { success: false, message: "Operation cancelled" };
		}

		return result;
	}
}

export class C2S2CRemoteFunction<TArgs extends unknown[], TResp extends Response = Response> extends PERemoveEvent<
	CustomRemoteEventBase<[id: string, ret: TResp], [id: string, ...args: TArgs]>
> {
	/** @server */
	private invoked?: (player: Player, ...args: TArgs) => TResp;
	private readonly waiting = new Map<string, (ret: TResp) => void>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, id, ...args) => {
				if (!this.invoked) throw `Event ${name} was not subscribed to`;

				const result = this.invoked(player, ...args);
				this.event.FireClient(player, id, result);
			});
		} else if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((id, ret) => {
				const waiter = this.waiting.get(id);
				if (waiter) {
					this.waiting.delete(id);
					waiter(ret);
				}
			});
		}
	}

	/** @server */
	subscribe(func: typeof this.invoked & defined) {
		if (this.invoked) throw "what";
		this.invoked = func;
	}

	/** @client */
	send(...args: TArgs): ErrorResponse | TResp {
		const id = HttpService.GenerateGUID();
		this.event.FireServer(id, ...args);

		const [retfunc, waitfunc] = createWaiter<TResp>();
		this.waiting.set(id, retfunc);

		const result = waitfunc();
		if (isCanceled(result)) {
			return { success: false, message: "Operation cancelled" };
		}

		return result;
	}
}
