import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

type InputType = typeof InputController.inputType;
type Keys = InputType | "All";
type SigConnection = { Disconnect(): void };
type Sig<T> = {
	Connect(callback: T): SigConnection;
};
type Sub<T> = [signal: Sig<T>, callback: T];

export default class ControlEventHolder {
	private readonly events: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly eventsOnce: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly subscribed: SigConnection[] = [];

	private enabled = true;

	constructor() {
		this.enable();
	}

	public enable() {
		this.subscribeOnce("All", Signals.INPUT_TYPE_CHANGED_EVENT, (inputType) => this.inputTypeChanged(inputType));
	}

	public disable() {
		this.enabled = false;
		this.disconnect();
	}

	private disconnect() {
		for (const sub of this.subscribed) sub.Disconnect();
		this.subscribed.clear();
	}

	public inputTypeChanged(device: InputType) {
		if (!this.enabled) return;
		this.disconnect();

		const reg = (key: Keys) => {
			const events = this.events[key];
			if (events) {
				for (const [signal, callback] of events) {
					this.subscribed.push(signal.Connect(callback));
				}
			}

			const eventsOnce = this.eventsOnce[key];
			if (eventsOnce) {
				for (const [signal, callback] of eventsOnce) {
					this.subscribed.push(signal.Connect(callback));
				}
				eventsOnce.clear();
			}
		};

		reg("All");
		reg(device);
		this.subscribeOnce("All", Signals.INPUT_TYPE_CHANGED_EVENT, (inputType) => this.inputTypeChanged(inputType));
	}

	/** Register an input type change event */
	public onInputTypeChange(inputType: InputType, callback: () => void, executeImmediately = false) {
		this.events[inputType] ??= [];
		this.events[inputType]!.push([Signals.INPUT_TYPE_CHANGED_EVENT, callback]);

		if (executeImmediately && Signals.INPUT_TYPE.get() === inputType) callback();
	}

	/** Register an event */
	public subscribe<T extends Callback = Callback>(inputType: Keys, signal: Sig<T>, callback: T) {
		this.events[inputType] ??= [];
		this.events[inputType]!.push([signal, callback]);
	}

	/** Register an event that fires once */
	public subscribeOnce<T extends Callback = Callback>(inputType: Keys, signal: Sig<T>, callback: T) {
		this.eventsOnce[inputType] ??= [];
		this.eventsOnce[inputType]!.push([signal, callback]);
	}

	/** Subscribe to an observable value changed event */
	public subscribeObservable<T>(
		inputType: Keys,
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
	) {
		this.events[inputType] ??= [];

		const sub: Sub<(value: T, prev: T) => void> = [
			{
				Connect(callback) {
					const eventHandler = new EventHandler();
					observable.subscribe(eventHandler, callback);

					return {
						Disconnect() {
							eventHandler.unsubscribeAll();
						},
					};
				},
			},
			callback,
		];
		this.events[inputType]!.push(sub);

		if (executeImmediately) callback(observable.get(), observable.get());
	}
}
