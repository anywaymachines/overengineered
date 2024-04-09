export namespace Assert {
	export function notNull<T>(value: T, message?: string): asserts value is T & defined {
		if (value === undefined) throw `Value is undefined: ${message}`;
	}
	export function isNull<T>(value: T, message?: string): asserts value is T & undefined {
		if (value !== undefined) throw `Value is not undefined: ${value}: ${message}`;
	}
	export function isTrue(condition: boolean, message?: string): asserts condition is true {
		if (!condition) throw `Condition is not true: ${message}`;
	}
	export function isFalse(condition: boolean, message?: string): asserts condition is false {
		if (condition) throw `Condition is not false: ${message}`;
	}

	export function equals<T>(left: T | { get(): T }, right: T | { get(): T }, message?: string) {
		left = typeIs(left, "table") && "get" in left ? left.get() : left;
		right = typeIs(right, "table") && "get" in right ? right.get() : right;

		if (left !== right) {
			throw `${left} and ${right} are not equal: ${message}`;
		}
	}
	export function sequenceEquals<T>(left: readonly T[], right: readonly T[], message?: string) {
		if (left.size() !== right.size())
			throw `Array sizes are not equal: ${left.size()} vs ${right.size()}: ${message}`;

		for (let i = 0; i < left.size(); i++) {
			if (left[i] !== right[i]) {
				throw `Elements at index ${i} are not equal: ${left[i]} vs ${right[i]}: ${message}`;
			}
		}
	}

	export namespace Testing {
		export function test(description: string, test: () => void) {
			print(`  Running [${description}]`);
			test();
		}

		export function expect<T>(value: T): Expect<T> {
			return new Expect(value);
		}

		export class Expect<T> {
			constructor(private readonly value: T) {}

			toBe<T extends boolean | number | string>(this: Expect<T>, value: T) {
				Assert.equals(this.value, value);
				return this;
			}

			toEqual<T extends readonly unknown[]>(this: Expect<T>, value: T) {
				Assert.sequenceEquals(this.value, value);
				return this;
			}
		}
	}
}
