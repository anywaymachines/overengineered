export class ArgMiddleware<TArg> {
	private readonly middlewares: ((arg: TArg) => TArg)[] = [];

	addMiddleware(middleware: (arg: TArg) => TArg): SignalConnection {
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

	execute(arg: TArg): TArg {
		arg = { ...arg };
		for (const middleware of this.middlewares) {
			middleware(arg);
		}

		return arg;
	}
}
