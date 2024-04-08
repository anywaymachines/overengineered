import { Signal } from "shared/event/Signal";

export class Operation<TArgs extends unknown[], TResult extends {} = {}> {
	private readonly _executed = new Signal<(...args: TArgs) => void>();
	readonly executed = this._executed.asReadonly();
	private readonly middlewares: ((...args: [...TArgs, TArgs]) => Response)[] = [];

	constructor(private readonly func: (...args: TArgs) => Promise<Response<TResult>>) {}

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
	async execute(...args: TArgs): Promise<Response<TResult>> {
		const argarr = { ...args };
		for (const middleware of this.middlewares) {
			const response = middleware(...[...argarr, argarr]);
			if (!response.success) {
				return response;
			}
		}

		const response = await this.func(...argarr);
		if (!response.success) {
			return response;
		}

		this._executed.Fire(...args);
		return response;
	}
}
