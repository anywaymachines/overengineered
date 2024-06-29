import { EventHandler } from "shared/event/EventHandler";
import { ObservableValue } from "shared/event/ObservableValue";
import { JSON } from "shared/fixes/Json";
import type { CollectionChangedArgs, ReadonlyObservableCollection } from "shared/event/ObservableCollection";
import type { ReadonlyObservableMap } from "shared/event/ObservableMap";
import type { ReadonlyObservableValue, ReadonlySubscribeObservableValue } from "shared/event/ObservableValue";
import type { ReadonlyArgsSignal, ReadonlySignal } from "shared/event/Signal";

type Sub<T extends Callback> = readonly [signal: ReadonlySignal<T>, callback: T];

/** Event handler with the ability to disable event processing */
export class ComponentEvents {
	readonly eventHandler = new EventHandler();
	private readonly events: Sub<Callback>[] = [];

	constructor(
		private readonly state: IReadonlyComponent | (IReadonlyDestroyableComponent & IReadonlyEnableableComponent),
	) {
		state.onEnable(() => this.enable());
		if ("onDisable" in state) {
			state.onDisable(() => this.disable());
		}

		state.onDestroy(() => this.destroy());
	}

	private enable() {
		this.events.forEach((e) => this.connect(e));
	}
	private disable() {
		this.eventHandler.unsubscribeAll();
	}
	private destroy() {
		this.events.clear();
	}

	/** Add event to the event list */
	private connect(sub: Sub<Callback>): void {
		this.eventHandler.subscribe(sub[0], sub[1]);
	}

	private sub(events: Sub<Callback>[], sub: Sub<Callback>): void {
		events.push(sub);
		if (this.state.isEnabled()) {
			this.connect(sub);
		}
	}

	onEnable(func: (eventHandler: EventHandler) => void, executeImmediately = false) {
		this.state.onEnable(() => func(this.eventHandler));
		if (executeImmediately) {
			func(this.eventHandler);
		}
	}

	/** Register an event */
	subscribe<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: (...args: TArgs) => void): void {
		if (this.state.isDestroyed()) return;
		this.sub(this.events, [signal, callback]);
	}
	/** Register an event */
	subscribeRegistration(func: () => SignalConnection): void {
		if (this.state.isDestroyed()) return;
		this.onEnable(() => this.eventHandler.register(func()));
	}

	/** Register an event and immediately call the callback function */
	subscribeImmediately<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: () => void): void {
		if (this.state.isDestroyed()) return;
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
	/** Subscribe to an observable collection item added event */
	subscribeCollectionAdded<T extends defined>(
		observable: ReadonlyObservableCollection<T>,
		callback: (item: T) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void {
		this.subscribeCollection(
			observable,
			(update) => {
				if (update.kind !== "add") return;
				for (const item of update.added) {
					callback(item);
				}
			},
			executeOnEnable,
			executeImmediately,
		);
	}

	/** Subscribe to an observable map changed event */
	subscribeMap<K extends defined, V extends defined>(
		observable: ReadonlyObservableMap<K, V>,
		callback: (key: K, value: V | undefined) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void {
		this.subscribe(observable.changed, callback);

		if (executeOnEnable) {
			this.onEnable(() => {
				for (const [k, v] of observable.getAll()) {
					callback(k, v);
				}
			}, executeImmediately);
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
			(value) => instance.SetAttribute(name, value === undefined ? undefined : JSON.serialize(value)),
			true,
		);

		return observable;
	}

	/** Create an infinite loop that would only loop when this event holder is enabled */
	loop(interval: number, func: (dt: number) => void): SignalConnection {
		let stop = false;

		task.spawn(() => {
			let dt = 0;
			while (true as boolean) {
				if (this.state.isDestroyed()) return;
				if (stop) return;

				if (this.state.isEnabled()) {
					func(dt);
				}

				dt = task.wait(interval);
			}
		});

		return {
			Disconnect() {
				stop = true;
			},
		};
	}
}
