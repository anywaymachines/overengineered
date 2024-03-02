import Signal from "@rbxts/signal";

export interface ReadonlyObservableValue<T> {
	readonly changed: Pick<Signal<(value: T, prev: T) => void>, "Connect" | "ConnectParallel" | "Once" | "Wait">;

	get(): T;

	subscribe(func: (value: T, prev: T) => void): void;
	subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean | undefined): void;

	/** Automatically sets the provided ObservableValue value to the current one. */
	autoSet(observable: ObservableValue<T>, funcProvider?: (value: T) => T): void;
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

	public triggerChanged() {
		this.set(this.value, true);
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
	}

	public createChild<TKey extends keyof NonNullable<T>>(key: TKey, def: NonNullable<T>[TKey]) {
		const observable = new ObservableValue(this.value?.[key] ?? def);
		this.subscribe((value) => observable.set(value?.[key] ?? def));
		observable.subscribe((value) => {
			if (this.value !== undefined) {
				this.value![key] = value;
				this.set(this.value, true);
			}
		});

		return observable;
	}
	public createNullableChild<TKey extends keyof NonNullable<T>>(
		key: TKey,
		def: NonNullable<T>[TKey] | undefined,
	): ReadonlyObservableValue<NonNullable<T>[TKey] | undefined> {
		const observable = new ObservableValue<NonNullable<T>[TKey] | undefined>(this.value?.[key] ?? def);
		this.subscribe((value) => observable.set(value?.[key] ?? def));

		return observable;
	}

	asReadonly(): ReadonlyObservableValue<T> {
		return this;
	}

	static fromSignal<TSignal extends Signal<(arg: unknown) => void>>(
		signal: TSignal,
		defaultValue: TSignal extends Signal<(arg: infer T) => void> ? T : never,
	) {
		const observable = new ObservableValue(defaultValue);
		signal.Connect((arg) => observable.set(arg as typeof defaultValue));

		return observable;
	}
}
