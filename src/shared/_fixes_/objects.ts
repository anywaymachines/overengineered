export default class Objects {
	public static keys<T extends object>(object: T): (keyof T)[] {
		const result: (keyof T)[] = [];
		for (const [key] of Objects.pairs(object)) {
			result.push(key);
		}

		return result;
	}

	public static values<T extends object>(object: T): (T[keyof T] & defined)[] {
		const result: (T[keyof T] & defined)[] = [];
		for (const [_, value] of Objects.pairs(object)) {
			result.push(value);
		}

		return result;
	}

	public static pairs<T extends object>(
		object: T,
	): IterableFunction<LuaTuple<[keyof T, Exclude<T[keyof T], undefined> & defined]>> {
		return pairs(object) as IterableFunction<LuaTuple<[keyof T, Exclude<T[keyof T], undefined> & defined]>>;
	}

	public static entries<T extends object>(object: T): (readonly [keyof T, Exclude<T[keyof T], undefined>])[] {
		const result: [keyof T, Exclude<T[keyof T], undefined>][] = [];
		for (const [key, value] of Objects.pairs(object)) {
			result.push([key, value]);
		}

		return result;
	}

	public static assign<T extends object, TProps extends object>(
		toObj: T,
		properties: TProps & Partial<T>,
	): T & TProps {
		for (const [key, value] of this.entries(properties)) {
			(toObj as Record<keyof T | keyof TProps, unknown>)[key] = value;
		}

		return toObj as T & TProps;
	}

	public static copy<T extends object>(object: T): T {
		return { ...object };
	}

	public static fromEntries<T extends readonly Readonly<[key: string | number, value: unknown]>[]>(
		entries: T,
	): { [key in T[number][0]]: T[number][1] } {
		const result: Record<string | number, unknown> = {};

		if (entries) {
			for (const [key, value] of entries) {
				result[key] = value;
			}
		}

		return result as { [key in T[number][0]]: T[number][1] };
	}
}
