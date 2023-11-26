import ObservableValue from "./ObservableValue";

/** ObservableValue that stores a number that can be clamped */
export default class NumberObservableValue extends ObservableValue<number> {
	public readonly min;
	public readonly max;
	public readonly step;

	constructor(value: number, min: number, max: number, step: number) {
		super(value);

		this.min = min;
		this.max = max;
		this.step = step;
	}

	public getRange() {
		return this.max - this.min;
	}

	protected processValue(value: number) {
		return math.clamp(value - (value % this.step), this.min, this.max);
	}
}
