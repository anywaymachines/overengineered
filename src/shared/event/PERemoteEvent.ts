import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { ArgsSignal } from "shared/event/Signal";

type CreatableRemoteEvents = "UnreliableRemoteEvent" | "RemoteEvent";
type CreatableRemoteFunctions = "RemoteFunction";

type CustomRemoteEventBase<TArgToClient, TArgToServer> = Instance & {
	/** @server */
	readonly OnServerEvent: RBXScriptSignal<(player: Player, arg: TArgToServer) => void>;
	/** @client */
	readonly OnClientEvent: RBXScriptSignal<(arg: TArgToClient) => void>;

	/** @client */
	FireServer(arg: TArgToServer): void;
	/** @server */
	FireClient(player: Player, arg: TArgToClient): void;
};
type CustomRemoteFunctionBase<TArgToClient, TArgToServer, TRet = void> = Instance & {
	/** @server */
	OnServerInvoke?: (player: Player, arg: TArgToServer) => TRet;
	/** @client */
	OnClientInvoke?: (arg: TArgToClient) => TRet;

	/** @client */
	InvokeServer(arg: TArgToServer): TRet;
	/** @server */
	InvokeClient(player: Player, arg: TArgToClient): TRet;
};
type CustomRemoteEvent<TArg> = CustomRemoteEventBase<TArg, TArg>;

abstract class PERemoveEvent<TEvent extends Instance> {
	protected readonly event: TEvent;

	protected constructor(name: string, eventType: CreatableRemoteEvents | CreatableRemoteFunctions) {
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

export class BidirectionalRemoteEvent<TArg = undefined> {
	readonly s2c;
	readonly c2s;

	constructor(
		readonly name: string,
		eventType: CreatableRemoteEvents = "RemoteEvent",
	) {
		this.s2c = new S2CRemoteEvent<TArg>(name + "_s2c", eventType);
		this.c2s = new C2SRemoteEvent<TArg>(name + "_c2s", eventType);
	}
}

export class C2SRemoteEvent<TArg = undefined> extends PERemoveEvent<CustomRemoteEvent<TArg>> {
	/** @server */
	readonly invoked = new ArgsSignal<[player: Player, arg: TArg]>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((player, arg) => {
				try {
					this.invoked.Fire(player, arg);
				} catch (err) {
					throw `Error while calling a C2S event ${name} with argument '${arg}': ${err}`;
				}
			});
		}
	}

	/** @client */
	send(this: C2SRemoteEvent<undefined>): void;
	send(arg: TArg): void;
	send(arg?: TArg) {
		this.event.FireServer(arg!);
	}
}

export class S2CRemoteEvent<TArg = undefined> extends PERemoveEvent<CustomRemoteEvent<TArg>> {
	/** @client */
	readonly invoked = new ArgsSignal<[arg: TArg]>();

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((arg) => this.invoked.Fire(arg));
		}
	}

	/** @server */
	send(this: S2CRemoteEvent<undefined>, players: Player | readonly Player[] | "everyone", arg?: TArg): void;
	send(players: Player | readonly Player[] | "everyone", arg: TArg): void;
	send(players: Player | readonly Player[] | "everyone", arg?: TArg) {
		if (typeIs(players, "Instance")) {
			this.event.FireClient(players, arg!);
		} else if (players === "everyone") {
			for (const player of Players.GetPlayers()) {
				this.event.FireClient(player, arg!);
			}
		} else {
			for (const player of players) {
				this.event.FireClient(player, arg!);
			}
		}
	}
}

//

type WaiterMiddleware = {
	readonly start: () => ErrorResponse | (() => "continue" | ErrorResponse);
};
export namespace PERemoteEventMiddlewares {
	export function timeout(timeout: number): WaiterMiddleware {
		return {
			start: () => {
				const time = os.time();

				return () => {
					if (os.time() > time + timeout) {
						return { success: false, message: "Request timeout reached" };
					}

					return "continue";
				};
			},
		};
	}
	export function rateLimiter(limit: number, time: number): WaiterMiddleware {
		let current = 0;
		let lastCheck: number | undefined;

		return {
			start: () => {
				const now = os.time();
				print(now, lastCheck, current);

				lastCheck ??= now;
				if (now - lastCheck > time) {
					current = 0;
					lastCheck = now;
				}

				if (current >= limit) {
					return { success: false, message: "Too many requests" };
				}

				current++;
				return () => "continue";
			},
		};
	}
}

type Canceled = symbol;
const canceled: Canceled = {} as Canceled;
const isCanceled = <T>(cancel: Canceled | T): cancel is Canceled => cancel === canceled;
const errCanceled: ErrorResponse = { success: false, message: "Operation cancelled" };

const createWaiter = <TRet extends Response>(middlewares: readonly WaiterMiddleware[]) => {
	let result: TRet | undefined = undefined;
	let completed = false;

	const loopers: Exclude<ReturnType<WaiterMiddleware["start"]>, ErrorResponse>[] = [];
	for (const middleware of middlewares) {
		const result = middleware.start();
		if (typeIs(result, "table") && "success" in result) {
			return result;
		}

		loopers.push(result);
	}

	return {
		ret: (ret: TRet) => {
			result = ret;
			completed = true;
		},
		wait: (): ErrorResponse | TRet => {
			while (true as boolean) {
				task.wait();

				for (const looper of loopers) {
					const result = looper();
					if (typeIs(result, "table") && "success" in result) {
						return result;
					}
				}

				if (!completed) continue;
				break;
			}

			return result as TRet;
		},
	};
};

export class S2C2SRemoteFunction<TArg, TResp extends Response = Response> extends PERemoveEvent<
	CustomRemoteFunctionBase<TArg, TArg, TResp | ErrorResponse>
> {
	/** @client */
	private invoked?: (arg: TArg) => TResp;
	private readonly middlewares: WaiterMiddleware[] = [];

	constructor(name: string) {
		super(name, "RemoteFunction");

		if (RunService.IsClient()) {
			this.event.OnClientInvoke = (arg) => {
				if (!this.invoked) {
					return { success: false, message: `Event ${name} was not subscribed to` };
				}

				return this.invoked(arg);
			};
		}
	}

	addMiddleware(middleware: WaiterMiddleware): this {
		this.middlewares.push(middleware);
		return this;
	}

	/** @client */
	subscribe(func: typeof this.invoked & defined): SignalConnection {
		if (this.invoked) throw "what";
		this.invoked = func;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const selv = this;
		return {
			Disconnect() {
				selv.invoked = undefined;
			},
		};
	}

	/** @server */
	send(this: S2C2SRemoteFunction<undefined>, player: Player, arg?: TArg): ErrorResponse | TResp;
	send(player: Player, arg: TArg): ErrorResponse | TResp;
	send(player: Player, arg?: TArg): ErrorResponse | TResp {
		const waiter = createWaiter<TResp | ErrorResponse>(this.middlewares);
		if ("success" in waiter) return waiter;
		const { ret, wait } = waiter;

		const promise = Promise.try(() => this.event.InvokeClient(player, arg!));
		promise.andThen(ret);

		const result = wait();
		if (isCanceled(result)) {
			promise.cancel();
			return errCanceled;
		}

		return result;
	}
}

export class C2S2CRemoteFunction<TArg, TResp extends Response = Response> extends PERemoveEvent<
	CustomRemoteFunctionBase<TArg, TArg, TResp | ErrorResponse>
> {
	private readonly _sent = new ArgsSignal<[arg: TArg]>();
	/** @client */
	readonly sent = this._sent.asReadonly();

	/** @server */
	private invoked?: (player: Player, arg: TArg) => TResp;

	private readonly middlewares: WaiterMiddleware[] = [];

	constructor(name: string) {
		super(name, "RemoteFunction");

		if (RunService.IsServer()) {
			this.event.OnServerInvoke = (player, arg) => {
				if (!this.invoked) {
					return { success: false, message: `Event ${name} was not subscribed to` };
				}

				return this.invoked(player, arg);
			};
		}
	}

	addMiddleware(middleware: WaiterMiddleware): this {
		this.middlewares.push(middleware);
		return this;
	}

	/** @server */
	subscribe(func: typeof this.invoked & defined): SignalConnection {
		if (this.invoked) throw "what";
		this.invoked = func;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const selv = this;
		return {
			Disconnect() {
				selv.invoked = undefined;
			},
		};
	}

	/** @client */
	send<TResponse extends Response>(
		this: C2S2CRemoteFunction<undefined, TResponse>,
		arg?: TArg,
	): ErrorResponse | TResp;
	send(arg: TArg): ErrorResponse | TResp;
	send(arg?: TArg): ErrorResponse | TResp {
		this._sent.Fire(arg!);

		const waiter = createWaiter<TResp | ErrorResponse>(this.middlewares);
		if ("success" in waiter) return waiter;
		const { ret, wait } = waiter;

		const promise = Promise.try(() => this.event.InvokeServer(arg!));
		promise.andThen(ret);

		const result = wait();
		if (isCanceled(result)) {
			promise.cancel();
			return errCanceled;
		}

		return result;
	}
}

/** Remote event which:
 * On client, runs the callback and sends the event to everyone except himself
 * On server, sends the event to all players.
 */
export class C2CRemoteEvent<TArg = undefined> extends PERemoveEvent<CustomRemoteEventBase<TArg, TArg>> {
	/** @client */
	readonly invoked = new ArgsSignal<[arg: TArg]>();

	constructor(name: string, eventType: CreatableRemoteEvents) {
		super(name, eventType);

		if (RunService.IsServer()) {
			this.event.OnServerEvent.Connect((sender, arg) => {
				for (const player of Players.GetPlayers()) {
					if (player === sender) return;
					this.event.FireClient(player, arg);
				}
			});
		} else if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((arg) => {
				this.invoked.Fire(arg);
			});
		}
	}

	send(this: C2CRemoteEvent<undefined>): void;
	send(arg: TArg): void;
	send(arg?: TArg) {
		if (RunService.IsServer()) {
			for (const player of Players.GetPlayers()) {
				this.event.FireClient(player, arg!);
			}
		} else if (RunService.IsClient()) {
			this.invoked.Fire(arg!);
			this.event.FireServer(arg!);
		}
	}
}
