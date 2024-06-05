export namespace Objects {
	export function firstKey<T extends object>(object: T): keyof T | undefined {
		for (const [key] of asMap(object)) {
			return key;
		}
	}
	export function firstValue<T extends object>(object: T): T[keyof T] | undefined {
		for (const [, value] of asMap(object)) {
			return value;
		}
	}

	export function keys<T extends object>(object: T): (keyof T)[] {
		return asMap(object).keys();
	}

	export function values<T extends object>(object: T): (T[keyof T] & defined)[] {
		return asMap(object).values();
	}

	export function size(object: object): number {
		return asMap(object).size();
	}

	export function entriesArray<T extends object>(object: T): (readonly [keyof T, T[keyof T] & defined])[] {
		const result: [keyof T, T[keyof T] & defined][] = [];
		for (const [key, value] of asMap(object)) {
			result.push([key, value]);
		}

		return result;
	}

	export function assign<T extends object, TProps extends object>(
		toObj: T,
		properties: TProps & Partial<T>,
	): T & TProps {
		for (const [key, value] of asMap(properties)) {
			(toObj as Record<keyof T | keyof TProps, unknown>)[key] = value;
		}

		return toObj as T & TProps;
	}

	export function fromEntries<T extends readonly (readonly [key: string | number, value: defined])[]>(
		entries: T,
	): { [k in T[number][0]]: Extract<T[number], readonly [k, unknown]>[1] } {
		return asObject(new Map(entries) as Map<T[number][0], T[number][1]>) as { [key in T[number][0]]: T[number][1] };
	}

	export function writable<T extends object>(object: T): Writable<T> {
		return object;
	}
	export function awaitThrow<T>(promise: Promise<T>): T {
		const [success, ret] = promise.await();
		if (!success) throw ret;

		return ret;
	}
}
