import ObservableValue from "shared/event/ObservableValue";

export class Assert {
	static notNull<T>(value: T, message?: string): asserts value is T & defined {
		if (value === undefined) throw `Value is undefined: ${message}`;
	}
	static null<T>(value: T, message?: string): asserts value is T & undefined {
		if (value !== undefined) throw `Value is not undefined: ${value}: ${message}`;
	}
	static true(condition: boolean, message?: string): asserts condition is true {
		if (!condition) throw `Condition is not true: ${message}`;
	}
	static false(condition: boolean, message?: string): asserts condition is false {
		if (condition) throw `Condition is not false: ${message}`;
	}

	static equals<T>(left: T | ObservableValue<T>, right: T | ObservableValue<T>, message?: string) {
		left = typeIs(left, "table") && left instanceof ObservableValue ? left.get() : left;
		right = typeIs(right, "table") && right instanceof ObservableValue ? right.get() : right;

		if (left !== right) {
			throw `${left} and ${right} are not equal: ${message}`;
		}
	}
	static sequenceEquals<T>(left: readonly T[], right: readonly T[], message?: string) {
		if (left.size() !== right.size())
			throw `Array sizes are not equal: ${left.size()} vs ${right.size()}: ${message}`;

		for (let i = 0; i < left.size(); i++) {
			if (left[i] !== right[i]) {
				throw `Elements at index ${i} are not equal: ${left[i]} vs ${right[i]}: ${message}`;
			}
		}
	}
}
