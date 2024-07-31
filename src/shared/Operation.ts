import { ArgsSignal, Signal } from "shared/event/Signal";

type MiddlewareResponse<TArg> = Response<{ readonly arg?: TArg }>;
export class Operation<TArg, TResult extends {} = {}> {
	private readonly _executing = new ArgsSignal<[arg: TArg]>();
	readonly executing = this._executing.asReadonly();
	private readonly _executed = new ArgsSignal<[arg: TArg, result: TResult]>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares = new Set<(arg: TArg) => MiddlewareResponse<TArg>>();

	constructor(private readonly func: (arg: TArg) => Response<TResult>) {}

	addMiddleware(middleware: (arg: TArg) => MiddlewareResponse<TArg>): SignalConnection {
		this.middlewares.add(middleware);
		return Signal.connection(() => this.middlewares.delete(middleware));
	}
	/** Returns a middleware with a set, where if any of its functions return success, the whole middleware returns success. */
	createMiddlewareCombiner() {
		const funcs = new Set<(arg: TArg) => MiddlewareResponse<TArg>>();

		return {
			addFunc: (func: (arg: TArg) => MiddlewareResponse<TArg>): SignalConnection => {
				funcs.add(func);
				return Signal.connection(() => funcs.delete(func));
			},
			connection: Signal.multiConnection(
				Signal.connection(() => funcs.clear()),
				this.addMiddleware((arg): MiddlewareResponse<TArg> => {
					if (funcs.size() === 0) {
						return { success: true };
					}

					let err: ErrorResponse | undefined;
					for (const func of funcs) {
						const result = func(arg);
						if (result.success) {
							return result;
						}

						err = result;
					}

					return err ?? { success: false, message: "Unknown error" };
				}),
			),
		} as const;
	}

	execute(arg: TArg): Response<TResult> {
		$trace(`Executing operation ${this}`, arg);
		for (const middleware of this.middlewares) {
			const response = middleware(arg);
			if (!response.success) {
				return response;
			}

			if (response.arg) {
				arg = response.arg;
			}
		}

		this._executing.Fire(arg);

		const response = this.func(arg);
		if (!response.success) {
			return response;
		}

		this._executed.Fire(arg, response);
		return response;
	}
}
