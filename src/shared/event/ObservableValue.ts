import Signal from "@rbxts/signal";
import EventHandler from "shared/event/EventHandler";

export interface ReadonlyBindable<T> {
	get(): T;

	subscribe(eventHandler: EventHandler, func: (value: T) => void): void;
	subscribe(eventHandler: EventHandler, func: (value: T) => void, executeImmediately: boolean | undefined): void;
}

/** Stores a value and provides and event of it being changed */
export default class Bindable<T> implements ReadonlyBindable<T> {
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

	public get() {
		return this.value;
	}

	public subscribe(
		eventHandler: EventHandler | undefined,
		func: (value: T, prev: T) => void,
		executeImmediately: boolean = false,
	) {
		if (eventHandler) eventHandler.subscribe(this.changed, func);
		else this.changed.Connect(func);

		if (executeImmediately) func(this.get(), this.get());
	}
}
