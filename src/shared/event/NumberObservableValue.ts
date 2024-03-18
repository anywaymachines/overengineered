import ObservableValue from "./ObservableValue";

/** ObservableValue that stores a number that can be clamped */
export default class NumberObservableValue<T extends number | undefined = number> extends ObservableValue<T> {
	readonly min;
	readonly max;
	readonly step;

	constructor(value: T, min: number, max: number, step: number) {
		super(value);

		this.min = min;
		this.max = max;
		this.step = step;
	}

	getRange() {
		return this.max - this.min;
	}

	protected processValue(value: T) {
		if (value === undefined) return value;

		const halfstep = this.step / 2;
		return math.clamp(value - ((value + halfstep) % this.step) + halfstep, this.min, this.max) as T;
	}
}
