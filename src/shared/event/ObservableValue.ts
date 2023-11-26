import Signal from "@rbxts/signal";

export interface ReadonlyObservableValue<T> {
	readonly changed: Pick<Signal<(value: T, prev: T) => void>, "Connect" | "ConnectParallel" | "Once" | "Wait">;

	get(): T;

	subscribe(func: (value: T, prev: T) => void): void;
	subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean | undefined): void;
}

/** Stores a value and provides and event of it being changed */
export default class ObservableValue<T> implements ReadonlyObservableValue<T> {
	public readonly changed: Pick<
		Signal<(value: T, prev: T) => void>,
		"Connect" | "ConnectParallel" | "Once" | "Wait"
	> = new Signal<(value: T, prev: T) => void>();

	private value: T;

	constructor(value: T) {
		this.value = value;
	}

	public set(value: T, forceSet = false) {
		value = this.processValue(value);

		if (!forceSet && this.value === value) return;
		const prev = this.get();

		this.value = value;
		(this.changed as Signal<(value: T, prev: T) => void>).Fire(value, prev);
	}

	public get() {
		return this.value;
	}

	/** Function that modifies the value before it gets stored */
	protected processValue(value: T) {
		return value;
	}

	/** Subscribes to the value changed event */
	public subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean = false) {
		this.changed.Connect(func);

		if (executeImmediately) {
			func(this.get(), this.get());
		}
	}

	/** Automatically sets the provided ObservableValue value to the current one. */
	public autoSet(observable: ObservableValue<T>, funcProvider?: (value: T) => T) {
		this.subscribe((value) => observable.set(funcProvider === undefined ? value : funcProvider(value)), true);
	}

	/** Binds to the other ObservableValue, making their values to share their value and events. */
	public bindTo(observable: ObservableValue<T>) {
		this.subscribe((value) => observable.set(value));
		observable.subscribe((value) => this.set(value), true);

		this.set(observable.get());
	}
}
