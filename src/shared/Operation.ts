import { Signal } from "shared/event/Signal";

export class Operation<TArgs extends unknown[], TResult extends {} = {}> {
	private readonly _executed = new Signal<(...args: [...TArgs, result: TResult]) => void>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares: ((...args: [...TArgs, TArgs]) => Response)[] = [];

	constructor(private readonly func: (...args: TArgs) => Response<TResult>) {}

	addMiddleware(middleware: (...args: [...TArgs, TArgs]) => Response): { Disconnect(): void } {
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
	execute(...args: TArgs): Response<TResult> {
		$trace(`Executing operation ${this} with ${select("#", ...args)} args`, ...args);
		const argarr = { ...args };
		for (const middleware of this.middlewares) {
			const response = middleware(...[...argarr, argarr]);
			if (!response.success) {
				return response;
			}
		}

		const response = this.func(...argarr);
		if (!response.success) {
			return response;
		}

		this._executed.Fire(...[...args, response]);
		return response;
	}
}

export class Operation2<TArg extends object & { readonly [k in string]: unknown }, TResult extends {} = {}> {
	private readonly _executed = new Signal<(...args: [arg: TArg, result: TResult]) => void>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares: ((...args: [arg: TArg, editableArg: Writable<TArg>]) => Response)[] = [];

	constructor(private readonly func: (arg: TArg) => Response<TResult>) {}

	addMiddleware(middleware: (...args: [arg: TArg, editableArg: Writable<TArg>]) => Response): { Disconnect(): void } {
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
			const response = middleware(arg, arg);
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
