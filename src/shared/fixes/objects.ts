export namespace Objects {
	export function firstKey<T extends object>(object: T): keyof T | undefined {
		for (const [key] of pairs_(object)) {
			return key;
		}
	}
	export function firstValue<T extends object>(object: T): T[keyof T] | undefined {
		for (const [, value] of pairs_(object)) {
			return value;
		}
	}

	export function keys<T extends object>(object: T): (keyof T)[] {
		const result: (keyof T)[] = [];
		for (const [key] of Objects.pairs_(object)) {
			result.push(key);
		}

		return result;
	}

	export function values<T extends object>(object: T): (T[keyof T] & defined)[] {
		const result: (T[keyof T] & defined)[] = [];
		for (const [_, value] of Objects.pairs_(object)) {
			result.push(value);
		}

		return result;
	}

	export function size(object: object): number {
		let size = 0;
		for (const [_] of pairs(object)) {
			size++;
		}

		return size;
	}

	export function pairs_<T extends object>(
		object: T,
	): IterableFunction<LuaTuple<[keyof T, Exclude<T[keyof T], undefined> & defined]>> {
		return pairs(object) as IterableFunction<LuaTuple<[keyof T, Exclude<T[keyof T], undefined> & defined]>>;
	}

	export function entriesArray<T extends object>(object: T): (readonly [keyof T, Exclude<T[keyof T], undefined>])[] {
		const result: [keyof T, Exclude<T[keyof T], undefined>][] = [];
		for (const [key, value] of Objects.pairs_(object)) {
			result.push([key, value]);
		}

		return result;
	}

	export function assign<T extends object, TProps extends object>(
		toObj: T,
		properties: TProps & Partial<T>,
	): T & TProps {
		for (const [key, value] of Objects.pairs_(properties)) {
			(toObj as Record<keyof T | keyof TProps, unknown>)[key] = value;
		}

		return toObj as T & TProps;
	}

	export function copy<T extends object>(object: T): T {
		return { ...object };
	}

	export function fromEntries<T extends readonly Readonly<[key: string | number, value: unknown]>[]>(
		entries: T,
	): { [k in T[number][0]]: Extract<T[number], readonly [k, unknown]>[1] } {
		const result: Record<string | number, unknown> = {};

		if (entries) {
			for (const [key, value] of entries) {
				result[key] = value;
			}
		}

		return result as { [key in T[number][0]]: T[number][1] };
	}

	export function asMap<TKey extends string, TValue extends defined>(
		object: object & Record<TKey, TValue>,
	): Map<TKey, TValue> {
		return object as Map<TKey, TValue>;
	}
}
