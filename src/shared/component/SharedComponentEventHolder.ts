import EventHandler from "shared/event/EventHandler";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import SlimSignal from "shared/event/SlimSignal";

type Sub<T extends Callback> = readonly [signal: RBXScriptSignal<T>, callback: T];

/** Event handler with the ability to disable event processing */
export default class SharedComponentEventHolder {
	readonly onEnabled = new SlimSignal();
	readonly onDisabled = new SlimSignal();
	readonly onDestroyed = new SlimSignal();
	readonly eventHandler = new EventHandler();
	private readonly events: Sub<Callback>[] = [];

	private enabled = false;
	private destroyed = false;

	/** @returns Is event processing enabled */
	isEnabled(): boolean {
		return this.enabled;
	}

	/** @returns Is destroyed */
	isDestroyed(): boolean {
		return this.destroyed;
	}

	/** Enable the event processing */
	enable(): void {
		if (this.enabled) return;

		this.enabled = true;
		this.disconnect();

		this.onEnabled.Fire();
		this.events.forEach((e) => this.connect(e));
	}

	/** Disable the event processing */
	disable(): void {
		if (!this.enabled) return;

		this.enabled = false;
		this.onDisabled.Fire();
		this.disconnect();
	}

	/** Add event to the event list */
	private connect(sub: Sub<Callback>): void {
		this.eventHandler.subscribe(sub[0], sub[1]);
	}

	/** Unsubscribe from all subscribed events */
	protected disconnect(): void {
		this.eventHandler.unsubscribeAll();
	}

	/** Register an event that fires on enable */
	onEnable(callback: () => void, executeImmediately = false): void {
		this.onEnabled.Connect(callback);
		if (executeImmediately) callback();
	}

	/** Register an event that fires on disable */
	onDisable(callback: () => void, executeImmediately = false): void {
		this.onDisabled.Connect(callback);
		if (executeImmediately) callback();
	}

	/** Register an event that fires on destroy */
	onDestroy(callback: () => void): void {
		this.onDestroyed.Connect(callback);
	}

	private sub(events: Sub<Callback>[], sub: Sub<Callback>): void {
		events.push(sub);
		if (this.enabled) this.connect(sub);
	}

	/** Register an event */
	subscribe<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T): void {
		this.sub(this.events, [signal, callback]);
	}

	/** Subscribe to an observable value changed event */
	subscribeObservable<T>(
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
	): void {
		this.subscribe(observable.changed, callback);
		if (executeImmediately) {
			this.onEnable(() => callback(observable.get(), observable.get()), true);
		}
	}

	/** Create an `ReadonlyObservableValue` from an `Instance` property */
	readonlyObservableFromInstanceParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ReadonlyObservableValue<TInstance[TParam]> {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		this.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));

		return observable;
	}

	/** Create an `ObservableValue` from an `Instance` property */
	observableFromInstanceParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		this.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));
		this.subscribeObservable(observable, (value) => (instance[param] = value), true);

		return observable;
	}

	/** Create an infinite loop that would only loop when this event holder is enabled
	 * @returns Function that stops the loop
	 */
	loop(interval: number, func: () => void) {
		let stop = false;

		spawn(() => {
			while (true as boolean) {
				task.wait(interval);
				if (this.isDestroyed()) return;
				if (stop) return;
				if (!this.isEnabled()) continue;

				func();
			}
		});

		return () => (stop = true);
	}

	/* eslint-disable @typescript-eslint/no-this-alias */
	/** Disable this event holder and remove all event subscriptions */
	destroy(): void {
		this.onDestroyed.Fire();
		this.disable();

		this.onEnabled.unsubscribeAll();
		this.onDisabled.unsubscribeAll();
		this.onDestroyed.unsubscribeAll();
		this.eventHandler.unsubscribeAll();

		const tis = this;
		delete (this as unknown as { events?: typeof tis.events }).events;

		this.destroyed = true;
	}
}
