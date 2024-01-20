export default class Arrays {
	static ofType<TElements extends defined, TFilter extends TElements>(
		array: readonly TElements[],
		filterfunbc: { new (...args: readonly never[]): TFilter },
	): TFilter[] {
		return array.filter((e) => e instanceof filterfunbc) as TFilter[];
	}

	static map<TKey, TValue, TOut extends defined>(
		array: ReadonlyMap<TKey, TValue>,
		mapfunc: (key: TKey, value: TValue) => TOut,
	): TOut[] {
		const result: TOut[] = [];
		for (const [key, value] of array) {
			result.push(mapfunc(key, value));
		}

		return result;
	}

	static flatmap<TIn extends defined, TOut extends defined>(
		array: readonly TIn[],
		mapfunc: (value: TIn) => readonly TOut[],
	): TOut[] {
		const result: TOut[] = [];
		for (const value of array) {
			for (const v of mapfunc(value)) {
				result.push(v);
			}
		}

		return result;
	}

	static groupBy<T extends defined>(values: readonly T[], keyfunc: (value: T) => string) {
		const groups = new Map<string, T[]>();
		for (const value of values) {
			const key = keyfunc(value);
			if (!groups.get(key)) {
				groups.set(key, []);
			}

			groups.get(key)?.push(value);
		}

		return groups;
	}
}
