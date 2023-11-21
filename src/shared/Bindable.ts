import Signal from "@rbxts/signal";
import EventHandler from "shared/EventHandler";

export interface ReadonlyBindable<T> {
	get(): T;

	subscribe(eventHandler: EventHandler, func: (value: T) => void): void;
	subscribe(eventHandler: EventHandler, func: (value: T) => void, executeImmediately: boolean | undefined): void;
}

/** Stores a value and provides and event of it being changed */
export default class Bindable<T> implements ReadonlyBindable<T> {
	public readonly changed: Pick<Signal<(value: T) => void>, "Connect" | "ConnectParallel" | "Once" | "Wait"> =
		new Signal<(value: T) => void>();

	private value: T;

	constructor(value: T) {
		this.value = value;
	}

	public set(value: T) {
		this.value = value;
		(this.changed as Signal<(value: T) => void>).Fire(value);
	}

	public get() {
		return this.value;
	}

	public subscribe(eventHandler: EventHandler, func: (value: T) => void, executeImmediately: boolean = false) {
		eventHandler.subscribe(this.changed, func);
		if (executeImmediately) func(this.get());
	}
}
