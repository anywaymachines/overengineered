import InputHandler from "client/event/InputHandler";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";

type Sub<T extends Callback> = readonly [signal: RBXScriptSignal<T>, callback: T];

/** Event handler with the ability to disable event processing */
export default class ComponentEventHolder {
	private readonly prepareEvents: (() => void)[] = [];
	private readonly events: Sub<Callback>[] = [];
	private readonly eventsOnce: Sub<Callback>[] = [];
	private readonly subscribed: RBXScriptConnection[] = [];

	private readonly inputHandler = new InputHandler();

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

		for (const event of this.prepareEvents) {
			event();
		}

		this.events.forEach((e) => this.connect(e));
		this.eventsOnce.forEach((e) => this.connect(e));
		this.eventsOnce.clear();
	}

	/** Disable the event processing */
	disable(): void {
		if (!this.enabled) return;

		this.enabled = false;
		this.disconnect();
	}

	/** Add event to the event list */
	private connect(sub: Sub<Callback>): void {
		this.subscribed.push(sub[0].Connect(sub[1]));
	}

	/** Unsubscribe from all subscribed events */
	private disconnect(): void {
		for (const sub of this.subscribed) {
			sub.Disconnect();
		}

		this.inputHandler.unsubscribeAll();
		this.subscribed.clear();
	}

	/** Register an event that fires on enable and input type change */
	onPrepare(callback: () => void, executeImmediately = false): void {
		this.prepareEvents.push(callback);
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

	/** Register an event that fires once */
	subscribeOnce<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T): void {
		this.sub(this.eventsOnce, [signal, callback]);
	}

	/** Register an InputBegan event */
	onInputBegin(callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onInputBegan(callback));
	}
	/** Register an InputEnded event */
	onInputEnd(callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onInputEnded(callback));
	}
	/** Register an InputBegan event, filtered by a keyboard key */
	onKeyDown(key: KeyCode, callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onKeyDown(key, callback));
	}
	/** Register an InputEnded event, filtered by a keyboard key */
	onKeyUp(key: KeyCode, callback: (input: InputObject) => void) {
		this.onPrepare(() => this.inputHandler.onKeyUp(key, callback));
	}

	/** Subscribe to an observable value changed event */
	subscribeObservable<T>(
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
	): void {
		this.subscribe(observable.changed, callback);
		if (executeImmediately) {
			this.onPrepare(() => callback(observable.get(), observable.get()), true);
		}
	}

	/** Create an `ObservableValue` from an `Instance` property */
	observableFromGuiParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		this.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));

		return observable;
	}

	/* eslint-disable @typescript-eslint/no-this-alias */
	/** Disable this event holder and remove all event subscriptions */
	destroy(): void {
		this.disable();
		this.inputHandler.destroy();

		const tis = this;
		delete (this as unknown as { prepareEvents?: typeof tis.prepareEvents }).prepareEvents;
		delete (this as unknown as { events?: typeof tis.events }).events;
		delete (this as unknown as { eventsOnce?: typeof tis.eventsOnce }).eventsOnce;
		delete (this as unknown as { subscribed?: typeof tis.subscribed }).subscribed;
	}
}
