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

	public set(value: T) {
		const prev = this.get();
		this.value = value;
		(this.changed as Signal<(value: T, prev: T) => void>).Fire(value, prev);
	}

	public setIfNotSame(value: T) {
		if (this.value === value) return;
		this.set(value);
	}

	public get() {
		return this.value;
	}

	public subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean = false) {
		this.changed.Connect(func);

		if (executeImmediately) {
			func(this.get(), this.get());
		}
	}
}
