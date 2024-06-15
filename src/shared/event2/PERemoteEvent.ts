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

export class S2C2SRemoteFunction<TArgs extends unknown[], TResp extends Response = Response> extends PERemoveEvent<
	CustomRemoteEventBase<[id: string, ...args: TArgs], [id: string, ret: TResp | ErrorResponse]>
> {
	/** @client */
	private invoked?: (...args: TArgs) => TResp;
	private readonly waiting = new Map<string, { player: Player; retfunc: (ret: TResp | ErrorResponse) => void }>();
	private readonly middlewares: WaiterMiddleware[] = [];

	constructor(name: string, eventType: CreatableRemoteEvents = "RemoteEvent") {
		super(name, eventType);

		if (RunService.IsClient()) {
			this.event.OnClientEvent.Connect((id, ...args) => {
				if (!this.invoked) {
					this.event.FireServer(id, {
						success: false,
						message: `Event ${name} was not subscribed to`,
					});

					throw `Event ${name} was not subscribed to`;
				}

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

	addMiddleware(middleware: WaiterMiddleware): this {
		this.middlewares.push(middleware);
		return this;
	}

	/** @client */
	subscribe(func: typeof this.invoked & defined) {
		if (this.invoked) throw "what";
		this.invoked = func;
	}

	/** @server */
	send(player: Player, ...args: TArgs): ErrorResponse | TResp {
		const waiter = createWaiter<TResp | ErrorResponse>(this.middlewares);
		if ("success" in waiter) return waiter;

		const id = HttpService.GenerateGUID();
		this.event.FireClient(player, id, ...args);

		const { ret, wait } = waiter;
		this.waiting.set(id, { player, retfunc: ret });

		const result = wait();
		if (isCanceled(result)) {
			return errCanceled;
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
	private readonly middlewares: WaiterMiddleware[] = [];

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

	addMiddleware(middleware: WaiterMiddleware): this {
		this.middlewares.push(middleware);
		return this;
	}

	/** @server */
	subscribe(func: typeof this.invoked & defined) {
		if (this.invoked) throw "what";
		this.invoked = func;
	}

	/** @client */
	send(...args: TArgs): ErrorResponse | TResp {
		const waiter = createWaiter<TResp>(this.middlewares);
		if ("success" in waiter) return waiter;

		const id = HttpService.GenerateGUID();
		this.event.FireServer(id, ...args);

		const { ret, wait } = waiter;
		this.waiting.set(id, ret);

		const result = wait();
		if (isCanceled(result)) {
			return errCanceled;
		}

		return result;
	}
}
