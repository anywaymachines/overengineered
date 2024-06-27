import { Signal } from "shared/event/Signal";

type MiddlewareResponse<TArg> = Response | Response<{ readonly arg: TArg }>;
export class Operation<TArg, TResult extends {} = {}> {
	private readonly _executed = new Signal<(...args: [arg: TArg, result: TResult]) => void>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares: ((arg: TArg) => MiddlewareResponse<TArg>)[] = [];

	constructor(private readonly func: (arg: TArg) => Response<TResult>) {}

	addMiddleware(middleware: (arg: TArg) => MiddlewareResponse<TArg>): { Disconnect(): void } {
		this.middlewares.push(middleware);

		const list = this.middlewares;
		return {
			Disconnect() {
				const index = list.indexOf(middleware);
				if (index !== -1) {
					list.remove(index);
				}
			},
		};
	}
	execute(arg: TArg): Response<TResult> {
		$trace(`Executing operation ${this}`, arg);
		for (const middleware of this.middlewares) {
			const response = middleware(arg);
			if (!response.success) {
				return response;
			}

			if ("arg" in response) {
				arg = response.arg;
			}
		}

		const response = this.func(arg);
		if (!response.success) {
			return response;
		}

		this._executed.Fire(arg, response);
		return response;
	}
}
