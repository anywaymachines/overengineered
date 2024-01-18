import { ReadonlyObservableValue } from "shared/event/ObservableValue";

export default class Test {
	static ensureEquals<T>(left: T | ReadonlyObservableValue<T>, right: T | ReadonlyObservableValue<T>) {
		left = typeIs(left, "table") && "get" in left ? left.get() : left;
		right = typeIs(right, "table") && "get" in right ? right.get() : right;

		if (left !== right) {
			throw `${left} and ${right} are not equal`;
		}
	}
}
