import { ComponentBase } from "shared/component/ComponentBase";
import { EventHandler } from "shared/event/EventHandler";
import { ObservableValue } from "shared/event/ObservableValue";
import { JSON } from "shared/fixes/Json";
import type { CollectionChangedArgs, ReadonlyObservableCollection } from "shared/event/ObservableCollection";
import type { ReadonlyObservableValue, ReadonlySubscribeObservableValue } from "shared/event/ObservableValue";
import type { ReadonlyArgsSignal, ReadonlySignal } from "shared/event/Signal";
import type { JsonSerializablePrimitive } from "shared/fixes/Json";

type Sub<T extends Callback> = readonly [signal: ReadonlySignal<T>, callback: T];

/** Event handler with the ability to disable event processing */
export class ComponentEvents extends ComponentBase {
	readonly eventHandler = new EventHandler();
	private readonly events: Sub<Callback>[] = [];

	constructor() {
		super();

		this.onEnable(() => this.events.forEach((e) => this.connect(e)));
		this.onDisable(() => this.eventHandler.unsubscribeAll());
		this.onDestroy(() => this.events.clear());
	}

	/** Add event to the event list */
	private connect(sub: Sub<Callback>): void {
		this.eventHandler.subscribe(sub[0], sub[1]);
	}

	private sub(events: Sub<Callback>[], sub: Sub<Callback>): void {
		events.push(sub);
		if (this.isEnabled()) {
			this.connect(sub);
		}
	}

	onEnable(func: (eventHandler: EventHandler) => void, executeImmediately = false) {
		super.onEnable(() => func(this.eventHandler));
		if (executeImmediately) {
			func(this.eventHandler);
		}
	}
	onDisable(func: (eventHandler: EventHandler) => void) {
		super.onDisable(() => func(this.eventHandler));
	}

	/** Register an event */
	subscribe<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: (...args: TArgs) => void): void {
		if (this.isDestroyed()) return;
		this.sub(this.events, [signal, callback]);
	}

	/** Register an event and immediately call the callback function */
	subscribeImmediately<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: () => void): void {
		if (this.isDestroyed()) return;
		this.sub(this.events, [signal, callback]);
		callback();
	}

	/** Subscribe to an observable value changed event */
	subscribeObservable<T>(
		observable: ReadonlySubscribeObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void {
		this.subscribe(observable.changed, callback);
		if (executeOnEnable) {
			this.onEnable(() => callback(observable.get(), observable.get()), executeImmediately);
		}
	}

	/** Subscribe to an observable collection changed event */
	subscribeCollection<T extends defined>(
		observable: ReadonlyObservableCollection<T>,
		callback: (update: CollectionChangedArgs<T>) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void {
		this.subscribe(observable.changed, callback);
		if (executeOnEnable) {
			this.onEnable(() => callback({ kind: "add", added: observable.getArr() }), executeImmediately);
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

	/** Create an `ObservableValue` from an `Instance` attribute */
	observableFromAttribute<TType extends AttributeValue>(
		instance: Instance,
		name: string,
	): ObservableValue<TType | undefined> {
		const observable = new ObservableValue<TType | undefined>(instance.GetAttribute(name) as TType | undefined);
		this.subscribe(instance.GetAttributeChangedSignal(name), () =>
			observable.set(instance.GetAttribute(name) as TType | undefined),
		);
		this.subscribeObservable(observable, (value) => instance.SetAttribute(name, value));

		return observable;
	}

	/** Create an `ObservableValue` from an `Instance` attribute, using JSON.ts */
	observableFromAttributeJson<TType>(instance: Instance, name: string): ObservableValue<TType | undefined> {
		const json = instance.GetAttribute(name) as string | undefined;
		const observable = new ObservableValue<TType | undefined>(
			json !== undefined ? JSON.deserialize<TType>(json) : undefined,
		);

		this.subscribe(instance.GetAttributeChangedSignal(name), () => {
			const json = instance.GetAttribute(name) as string | undefined;
			const val = json !== undefined ? JSON.deserialize<TType>(json) : undefined;

			observable.set(val);
		});
		this.subscribeObservable(
			observable,
			(value) =>
				instance.SetAttribute(
					name,
					value === undefined ? undefined : JSON.serialize(value as JsonSerializablePrimitive),
				),
			true,
		);

		return observable;
	}

	/** Create an infinite loop that would only loop when this event holder is enabled
	 * @returns Function that stops the loop
	 */
	loop(interval: number, func: () => void) {
		let stop = false;

		spawn(() => {
			while (true as boolean) {
				if (this.isDestroyed()) return;
				if (stop) return;

				if (this.isEnabled()) {
					func();
				}

				task.wait(interval);
			}
		});

		return () => (stop = true);
	}
}
