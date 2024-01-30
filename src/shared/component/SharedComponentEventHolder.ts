import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import SlimSignal from "shared/event/SlimSignal";

type Sub<T extends Callback> = readonly [signal: RBXScriptSignal<T>, callback: T];

/** Event handler with the ability to disable event processing */
export default class SharedComponentEventHolder {
	readonly onEnabled = new SlimSignal();
	readonly onDisabled = new SlimSignal();
	private readonly events: Sub<Callback>[] = [];
	private readonly subscribed: RBXScriptConnection[] = [];

	private enabled = false;

	/** @returns Is event processing enabled */
	isEnabled(): boolean {
		return this.enabled;
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
		this.subscribed.push(sub[0].Connect(sub[1]));
	}

	/** Unsubscribe from all subscribed events */
	protected disconnect(): void {
		for (const sub of this.subscribed) {
			sub.Disconnect();
		}

		this.subscribed.clear();
	}

	/** Register an event that fires on enable */
	onEnable(callback: () => void, executeImmediately = false): void {
		this.onEnabled.subscribe(callback);
		if (executeImmediately) callback();
	}

	/** Register an event that fires on disable */
	onDisable(callback: () => void, executeImmediately = false): void {
		this.onDisabled.subscribe(callback);
		if (executeImmediately) callback();
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

	/** Create an `ObservableValue` from an `Instance` property */
	observableFromInstanceParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		this.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));

		return observable;
	}

	/**
	 * Create an `ObservableValue` from an `Instance` property
	 * @deprecated Use observableFromInstanceParam instead
	 */
	observableFromGuiParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> {
		return this.observableFromInstanceParam(instance, param);
	}

	/* eslint-disable @typescript-eslint/no-this-alias */
	/** Disable this event holder and remove all event subscriptions */
	destroy(): void {
		this.disable();

		this.onEnabled.unsubscribeAll();
		this.onDisabled.unsubscribeAll();

		const tis = this;
		delete (this as unknown as { events?: typeof tis.events }).events;
		delete (this as unknown as { subscribed?: typeof tis.subscribed }).subscribed;
	}
}
