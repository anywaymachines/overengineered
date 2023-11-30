export default class Objects {
	public static keys<T extends object>(object: T) {
		const result: (keyof T)[] = [];
		for (const [key] of pairs(object)) {
			result.push(key as keyof T);
		}

		return result;
	}

	public static values<T extends object>(object: T) {
		const result: (T[keyof T] & defined)[] = [];
		for (const [_, value] of pairs(object)) {
			result.push(value as T[keyof T] & defined);
		}

		return result;
	}

	public static entries<T extends object>(object: T) {
		const result: (readonly [keyof T, Exclude<T[keyof T], undefined>])[] = [];
		for (const [key, value] of pairs(object)) {
			result.push([key as keyof T, value as Exclude<T[keyof T], undefined>]);
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

	public static copy<T extends object>(object: T) {
		return { ...object };
	}

	public static fromEntries<T extends readonly Readonly<[key: string | number, value: unknown]>[]>(entries: T) {
		const result: Record<string | number, unknown> = {};

		if (entries) {
			for (const [key, value] of entries) {
				result[key] = value;
			}
		}

		return result as { [key in T[number][0]]: T[number][1] };
	}
}
