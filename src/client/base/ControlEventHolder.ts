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

	private enabled = false;

	public enable() {
		if (this.enabled) return;

		this.enabled = true;
		this.subscribeOnce("All", Signals.INPUT_TYPE_CHANGED_EVENT, (inputType) => this.inputTypeChanged(inputType));
		this.inputTypeChanged(Signals.INPUT_TYPE.get());
	}

	private connect(sub: Sub<unknown>) {
		this.subscribed.push(sub[0].Connect(sub[1]));
	}
	private inputTypeChanged(device: InputType) {
		if (!this.enabled) return;
		this.disconnect();

		const reg = (key: Keys) => {
			this.events[key]?.forEach((e) => this.connect(e));

			this.eventsOnce[key]?.forEach((e) => this.connect(e));
			this.eventsOnce[key]?.clear();
		};

		this.subscribeOnce("All", Signals.INPUT_TYPE_CHANGED_EVENT, (inputType) => this.inputTypeChanged(inputType));
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

	private sub(events: Partial<Record<Keys, Sub<unknown>[]>>, inputType: Keys, sub: Sub<unknown>) {
		events[inputType] ??= [];
		events[inputType]!.push(sub);

		if (this.enabled) this.connect(sub);
	}

	/** Register an input type change event */
	public onInputTypeChange(callback: (inputType: InputType) => void, executeImmediately = false) {
		this.subscribe("All", Signals.INPUT_TYPE_CHANGED_EVENT, callback);
		if (executeImmediately) callback(Signals.INPUT_TYPE.get());
	}

	/** Register an event */
	public subscribe<T extends Callback = Callback>(inputType: Keys, signal: Sig<T>, callback: T) {
		this.sub(this.events, inputType, [signal, callback]);
	}

	/** Register an event that fires once */
	public subscribeOnce<T extends Callback = Callback>(inputType: Keys, signal: Sig<T>, callback: T) {
		this.sub(this.eventsOnce, inputType, [signal, callback]);
	}

	/** Subscribe to an observable value changed event */
	public subscribeObservable<T>(
		inputType: Keys,
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
	) {
		this.subscribe(inputType, observable.changed, callback);
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
