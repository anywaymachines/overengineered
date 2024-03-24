import { BlockLogicValue } from "shared/block/BlockLogicValue";
import NumberObservableValue from "shared/event/NumberObservableValue";

export class NumberBlockLogicValue extends BlockLogicValue<number> {
	readonly min;
	readonly max;
	readonly step;

	constructor(value: number, min: number, max: number, step: number) {
		super(value);

		this.min = min;
		this.max = max;
		this.step = step;
	}

	getRange() {
		return this.max - this.min;
	}

	protected processValue(value: number): number {
		if (value === undefined) return value;
		return NumberObservableValue.clamp(value, this.min, this.max, this.step);
	}
}
