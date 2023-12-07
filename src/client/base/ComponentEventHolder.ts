import InputController from "client/controller/InputController";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";

type Keys = InputType | "All";
type SigConnection = { Disconnect(): void };
type Sig<T> = { Connect(callback: T): SigConnection };
type Sub<T> = readonly [signal: Sig<T>, callback: T];

export default class ComponentEventHolder {
	private readonly prepareEvents: ((inputType: InputType) => void)[] = [];
	private readonly events: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly eventsOnce: Partial<Record<Keys, Sub<unknown>[]>> = {};
	private readonly subscribed: SigConnection[] = [];

	private enabled = false;

	public isEnabled(): boolean {
		return this.enabled;
	}

	public enable(): void {
		if (this.enabled) return;

		this.enabled = true;
		this.inputTypeChanged(InputController.inputType.get());
	}

	private connect(sub: Sub<unknown>): void {
		this.subscribed.push(sub[0].Connect(sub[1]));
	}
	private inputTypeChanged(inputType: InputType): void {
		if (!this.enabled) return;
		this.disconnect();
		this.subscribeOnce(InputController.inputType.changed, (inputType) => this.inputTypeChanged(inputType));

		for (const event of this.prepareEvents) {
			event(inputType);
		}

		const reg = (key: Keys) => {
			this.events[key]?.forEach((e) => this.connect(e));

			this.eventsOnce[key]?.forEach((e) => this.connect(e));
			this.eventsOnce[key]?.clear();
		};

		reg("All");
		reg(inputType);
	}

	public disable(): void {
		if (!this.enabled) return;

		this.enabled = false;
		this.disconnect();
	}

	private disconnect(): void {
		for (const sub of this.subscribed) sub.Disconnect();
		this.subscribed.clear();
	}

	/** Register an event that fires on enable and input type change */
	public onPrepare(callback: (inputType: InputType) => void, executeImmediately = false): void {
		this.prepareEvents.push(callback);
		if (executeImmediately) callback(InputController.inputType.get());
	}

	private sub(events: Partial<Record<Keys, Sub<unknown>[]>>, inputType: Keys, sub: Sub<unknown>): void {
		events[inputType] ??= [];
		events[inputType]!.push(sub);

		if (this.enabled) this.connect(sub);
	}

	/** Register an event */
	public subscribe<T extends Callback = Callback>(signal: Sig<T>, callback: T, inputType: Keys = "All"): void {
		this.sub(this.events, inputType, [signal, callback]);
	}

	/** Register an event that fires once */
	public subscribeOnce<T extends Callback = Callback>(signal: Sig<T>, callback: T, inputType: Keys = "All"): void {
		this.sub(this.eventsOnce, inputType, [signal, callback]);
	}

	/** Subscribe to an observable value changed event */
	public subscribeObservable<T>(
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeImmediately = false,
		inputType: Keys = "All",
	): void {
		this.subscribe(observable.changed, callback, inputType);
		if (executeImmediately) {
			this.onPrepare(() => callback(observable.get(), observable.get()), true);
		}
	}

	public observableFromGuiParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		this.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));

		return observable;
	}

	/* eslint-disable @typescript-eslint/no-this-alias */
	public destroy(): void {
		this.disable();

		const tis = this;
		delete (this as unknown as { prepareEvents?: typeof tis.prepareEvents }).prepareEvents;
		delete (this as unknown as { events?: typeof tis.events }).events;
		delete (this as unknown as { eventsOnce?: typeof tis.eventsOnce }).eventsOnce;
		delete (this as unknown as { subscribed?: typeof tis.subscribed }).subscribed;
	}
}
