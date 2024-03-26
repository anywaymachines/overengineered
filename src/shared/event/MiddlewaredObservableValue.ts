import ObservableValue from "shared/event/ObservableValue";

export class MiddlewaredObservableValue<T> extends ObservableValue<T> {
	private readonly middleware: ((value: T, prev: T) => T)[] = [];

	addMiddleware(func: (value: T, prev: T) => T) {
		this.middleware.push(func);
	}

	protected processValue(value: T): T {
		let prev = this.get();

		for (const middleware of this.middleware) {
			value = middleware(value, prev);
			prev = value;
		}

		return value;
	}
}
