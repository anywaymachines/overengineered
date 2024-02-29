export const Arrays = {
	ofMap: {
		keys: <TKey extends defined, TValue extends defined>(map: ReadonlyMap<TKey, TValue>): TKey[] => {
			return Arrays.ofMap.map(map, (k, v) => k);
		},
		values: <TKey extends defined, TValue extends defined>(map: ReadonlyMap<TKey, TValue>): TValue[] => {
			return Arrays.ofMap.map(map, (k, v) => v);
		},

		map<TKey extends defined, TValue extends defined, TOut extends defined>(
			map: ReadonlyMap<TKey, TValue>,
			func: (key: TKey, value: TValue) => TOut,
		): TOut[] {
			if (map.size() === 0) {
				return [];
			}

			const result: TOut[] = [];
			for (const [key, value] of map) {
				result.push(func(key, value));
			}

			return result;
		},

		filter<TKey extends defined, TValue extends defined>(
			map: ReadonlyMap<TKey, TValue>,
			func: (key: TKey, value: TValue) => boolean,
		): Map<TKey, TValue> {
			if (map.size() === 0) {
				return new Map();
			}

			const result = new Map<TKey, TValue>();
			for (const [key, value] of map) {
				if (!func(key, value)) continue;
				result.set(key, value);
			}

			return result;
		},

		find<TKey extends defined, TValue extends defined>(
			map: ReadonlyMap<TKey, TValue>,
			func: (key: TKey, value: TValue) => boolean,
		): readonly [key: TKey, value: TValue] | undefined {
			if (map.size() === 0) {
				return undefined;
			}

			for (const [key, value] of map) {
				if (!func(key, value)) continue;
				return [key, value];
			}

			return undefined;
		},
	},

	ofType<TElements extends defined, TFilter extends TElements>(
		array: readonly TElements[],
		filterfunbc: { new (...args: readonly never[]): TFilter },
	): TFilter[] {
		return array.filter((e) => e instanceof filterfunbc) as TFilter[];
	},

	mapSet<TValue, TOut extends defined>(array: ReadonlySet<TValue>, mapfunc: (value: TValue) => TOut): TOut[] {
		const result: TOut[] = [];
		for (const value of array) {
			result.push(mapfunc(value));
		}

		return result;
	},

	map<TKey, TValue, TOut extends defined>(
		array: ReadonlyMap<TKey, TValue>,
		mapfunc: (key: TKey, value: TValue) => TOut,
	): TOut[] {
		if (array.size() === 0) return [];

		const result: TOut[] = [];
		for (const [key, value] of array) {
			result.push(mapfunc(key, value));
		}

		return result;
	},

	flatmap<TIn extends defined, TOut extends defined>(
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
	},

	groupBySet<T extends defined, TOut>(values: ReadonlySet<T>, keyfunc: (value: T) => TOut) {
		const groups = new Map<TOut, T[]>();
		for (const value of values) {
			const key = keyfunc(value);
			if (!groups.get(key)) {
				groups.set(key, []);
			}

			groups.get(key)?.push(value);
		}

		return groups;
	},
	groupBy<T extends defined>(values: readonly T[], keyfunc: (value: T) => string) {
		const groups = new Map<string, T[]>();
		for (const value of values) {
			const key = keyfunc(value);
			if (!groups.get(key)) {
				groups.set(key, []);
			}

			groups.get(key)?.push(value);
		}

		return groups;
	},
} as const;
