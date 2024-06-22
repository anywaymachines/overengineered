import { Signal } from "shared/event/Signal";

export class Operation<TArg extends object & { readonly [k in string]: unknown }, TResult extends {} = {}> {
	private readonly _executed = new Signal<(...args: [arg: TArg, result: TResult]) => void>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares: ((arg: Writable<TArg>) => Response)[] = [];

	constructor(private readonly func: (arg: TArg) => Response<TResult>) {}

	addMiddleware(middleware: (arg: Writable<TArg>) => Response): { Disconnect(): void } {
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
		arg = { ...arg };

		$trace(`Executing operation ${this}`, arg);
		for (const middleware of this.middlewares) {
			const response = middleware(arg);
			if (!response.success) {
				return response;
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
