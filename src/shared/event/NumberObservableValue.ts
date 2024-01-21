import ObservableValue from "./ObservableValue";

/** ObservableValue that stores a number that can be clamped */
export default class NumberObservableValue<T extends number | undefined = number> extends ObservableValue<T> {
	public readonly min;
	public readonly max;
	public readonly step;

	constructor(value: T, min: number, max: number, step: number) {
		super(value);

		this.min = min;
		this.max = max;
		this.step = step;
	}

	public getRange() {
		return this.max - this.min;
	}

	protected processValue(value: T) {
		if (value === undefined) return value;
		return math.clamp(value - (value % this.step), this.min, this.max) as T;
	}
}
