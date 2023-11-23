import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

type InputType = typeof InputController.inputType;
type Keys = InputType | "All";
type SigConnection = { Disconnect(): void };
type Sig<T> = {
	Connect(callback: T): SigConnection;
};
type Sub<T> = [signal: Sig<T>, callback: T];

export default class ControlEventHolder {
	public readonly onEnable = new Signal<() => void>();
	private readonly inputTypeEvents: ((inputType: InputType) => void)[] = [];
	private readonly events: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly eventsOnce: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly subscribed: SigConnection[] = [];

	private enabled = false;

	public enable() {
		if (this.enabled) return;

		this.enabled = true;
		this.inputTypeChanged(Signals.INPUT_TYPE.get());
		this.onEnable.Fire();
	}

	private connect(sub: Sub<unknown>) {
		this.subscribed.push(sub[0].Connect(sub[1]));
	}
	private inputTypeChanged(device: InputType) {
		if (!this.enabled) return;
		this.disconnect();
		this.subscribeOnce(Signals.INPUT_TYPE_CHANGED_EVENT, (inputType) => this.inputTypeChanged(inputType));

		for (const event of this.inputTypeEvents) {
			event(Signals.INPUT_TYPE.get());
		}

		const reg = (key: Keys) => {
			this.events[key]?.forEach((e) => this.connect(e));

			this.eventsOnce[key]?.forEach((e) => this.connect(e));
			this.eventsOnce[key]?.clear();
		};

		reg("All");
		reg(device);
	}

	public disable() {
		if (!this.enabled) return;

		this.enabled = false;
		this.disconnect();
	}

	private disconnect() {
		for (const sub of this.subscribed) sub.Disconnect();
		this.subscribed.clear();
	}

	/** Register an input type change event */
	public subscribeInputTypeChange(callback: (inputType: InputType) => void, executeImmediately = false) {
		this.inputTypeEvents.push(callback);
		if (executeImmediately) callback(Signals.INPUT_TYPE.get());
	}

	/** Register an input type change event */
	public onInputType(inputType: InputType, callback: () => void, executeImmediately = false) {
		this.subscribeObservable(
			Signals.INPUT_TYPE,
			(newInputType) => {
				if (newInputType === inputType) callback();
			},
			executeImmediately,
		);
	}

	/** Register an events enable event */
	public subscribeOnEnable(callback: () => void, executeImmediately = false) {
		this.subscribe(this.onEnable, callback);
		if (executeImmediately) callback();
	}

	private sub(events: Partial<Record<Keys, Sub<unknown>[]>>, inputType: Keys, sub: Sub<unknown>) {
		events[inputType] ??= [];
		events[inputType]!.push(sub);

		if (this.enabled) this.connect(sub);
	}

	/** Register an event */
	public subscribe<T extends Callback = Callback>(signal: Sig<T>, callback: T, inputType: Keys = "All") {
		this.sub(this.events, inputType, [signal, callback]);
	}

	/** Register an event that fires once */
	public subscribeOnce<T extends Callback = Callback>(signal: Sig<T>, callback: T, inputType: Keys = "All") {
		this.sub(this.eventsOnce, inputType, [signal, callback]);
	}

	/** Subscribe to an observable value changed event */
	public subscribeObservable<T>(
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
		inputType: Keys = "All",
	) {
		this.subscribe(observable.changed, callback, inputType);
		if (executeImmediately) callback(observable.get(), observable.get());
	}

	public destroy() {
		for (const key of ["All", "Desktop", "Gamepad", "Touch"] as const) {
			delete this.events[key];
			delete this.eventsOnce[key];
		}

		this.disconnect();
	}
}
