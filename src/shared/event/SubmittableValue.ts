import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";
import type { ReadonlyArgsSignal } from "shared/event/Signal";

interface SubmittableValueBase<T> {
	readonly submitted: ReadonlyArgsSignal<[value: T]>;

	get(): T;
}
export interface ReadonlySubmittableValue<T> extends SubmittableValueBase<T> {
	readonly value: ReadonlyObservableValue<T>;
}
export interface SignalReadonlySubmittableValue<T> extends SubmittableValueBase<T> {
	readonly value: ObservableValue<T>;

	set(value: T): void;
}

export class SubmittableValue<T> implements ReadonlySubmittableValue<T>, SignalReadonlySubmittableValue<T> {
	static from<T>(value: T) {
		return new SubmittableValue(new ObservableValue(value));
	}

	readonly value;
	readonly _submitted = new ArgsSignal<[value: T]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(observable: ObservableValue<T>) {
		this.value = observable;
	}

	get(): T {
		return this.value.get();
	}

	set(value: T): void {
		this.value.set(value);
	}
	submit(value: T): void {
		this.set(value);
		this._submitted.Fire(value);
	}

	asFullReadonly(): ReadonlySubmittableValue<T> {
		return this;
	}
	asHalfReadonly(): SignalReadonlySubmittableValue<T> {
		return this;
	}
}
