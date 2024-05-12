const assign = <T extends object>(to: T, from: T) => {
	for (const [key, value] of pairs(from)) {
		to[key] = value;
	}
};

type sets = {
	readonly [k in keyof ReadonlySet<defined>]?: <T extends defined>(
		set: ReadonlySet<T>,
		...args: Parameters<ReadonlySet<T>[k]>
	) => ReturnType<ReadonlySet<T>[k]>;
};
export const SetMacros = {} as typeof _setMacros;
const _setMacros = {
	filter: <T extends defined>(set: ReadonlySet<T>, func: (item: T) => boolean): T[] => {
		const result: T[] = [];
		for (const item of set) {
			if (!func(item)) continue;
			result.push(item);
		}

		return result;
	},
	filterToSet: <T extends defined>(set: ReadonlySet<T>, func: (item: T) => boolean): Set<T> => {
		const result = new Set<T>();
		for (const item of set) {
			if (!func(item)) continue;
			result.add(item);
		}

		return result;
	},
	map: <T extends defined, TOut extends defined>(set: ReadonlySet<T>, func: (item: T) => TOut): TOut[] => {
		const result: TOut[] = [];
		for (const item of set) {
			result.push(func(item));
		}

		return result;
	},
	mapToSet: <T extends defined, TOut extends defined>(set: ReadonlySet<T>, func: (item: T) => TOut): Set<TOut> => {
		const result = new Set<TOut>();
		for (const item of set) {
			result.add(func(item));
		}

		return result;
	},
	flatmap: <T extends defined, TOut extends defined>(
		set: ReadonlySet<T>,
		func: (item: T) => readonly TOut[],
	): TOut[] => {
		const result: TOut[] = [];
		for (const item of set) {
			for (const v of func(item)) {
				result.push(v);
			}
		}

		return result;
	},
	flatmapToSet: <T extends defined, TOut extends defined>(
		set: ReadonlySet<T>,
		func: (item: T) => readonly TOut[],
	): Set<TOut> => {
		const result = new Set<TOut>();
		for (const item of set) {
			for (const v of func(item)) {
				result.add(v);
			}
		}

		return result;
	},
	find: <T extends defined>(set: ReadonlySet<T>, func: (item: T) => boolean): T | undefined => {
		for (const item of set) {
			if (!func(item)) continue;
			return item;
		}

		return undefined;
	},
	groupBy: <TKey extends defined, T extends defined>(
		array: ReadonlySet<T>,
		keyfunc: (value: T) => TKey,
	): Map<TKey, T[]> => {
		const groups = new Map<TKey, T[]>();
		for (const value of array) {
			const key = keyfunc(value);
			if (!groups.get(key)) {
				groups.set(key, []);
			}

			groups.get(key)?.push(value);
		}

		return groups;
	},

	count: <T extends defined>(set: ReadonlySet<T>, func: (value: T) => boolean): number => {
		let count = 0;
		for (const value of set) {
			if (func(value)) {
				count++;
			}
		}

		return count;
	},
	all: <T extends defined>(array: ReadonlySet<T>, func: (value: T) => boolean): boolean => {
		return !array.any((v) => !func(v));
	},
	any: <T extends defined>(array: ReadonlySet<T>, func: (value: T) => boolean): boolean => {
		return array.find(func) !== undefined;
	},
} satisfies sets;
assign(SetMacros, _setMacros);

type maps = {
	readonly [k in keyof ReadonlyMap<defined, defined>]?: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		...args: Parameters<ReadonlyMap<K, V>[k]>
	) => ReturnType<ReadonlyMap<K, V>[k]>;
};
export const MapMacros = {} as typeof _mapMacros;
const _mapMacros = {
	keys: <K extends defined, V extends defined>(map: ReadonlyMap<K, V>): K[] => {
		const result: K[] = [];
		for (const [key] of map) {
			result.push(key);
		}

		return result;
	},
	values: <K extends defined, V>(map: ReadonlyMap<K, V>): (V & defined)[] => {
		const result: (V & defined)[] = [];
		for (const [_, value] of map) {
			// value is never undefined in for loop
			result.push(value!);
		}

		return result;
	},

	count: <K extends defined, V extends defined>(
		array: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): number => {
		let count = 0;
		for (const [key, value] of array) {
			if (func(key, value)) {
				count++;
			}
		}

		return count;
	},
	filter: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): Map<K, V> => {
		const result = new Map<K, V>();
		for (const [key, value] of map) {
			if (!func(key, value)) continue;
			result.set(key, value);
		}

		return result;
	},
	map: <K extends defined, V extends defined, TOut extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => TOut,
	): TOut[] => {
		const result: TOut[] = [];
		for (const [key, value] of map) {
			result.push(func(key, value));
		}

		return result;
	},
	flatmap: <K extends defined, V extends defined, TOut extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => readonly TOut[],
	): TOut[] => {
		const result: TOut[] = [];
		for (const [key, value] of map) {
			for (const v of func(key, value)) {
				result.push(v);
			}
		}

		return result;
	},
	find: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): readonly [key: K, value: V] | undefined => {
		for (const [key, value] of map) {
			if (!func(key, value)) continue;
			return [key, value];
		}

		return undefined;
	},
	findKey: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): K | undefined => {
		for (const [key, value] of map) {
			if (!func(key, value)) continue;
			return key;
		}

		return undefined;
	},
	findValue: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): V | undefined => {
		for (const [key, value] of map) {
			if (!func(key, value)) continue;
			return value;
		}

		return undefined;
	},

	all: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): boolean => {
		return !map.any((k, v) => !func(k, v));
	},
	any: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => boolean,
	): boolean => {
		return map.findKey(func) !== undefined;
	},
} satisfies maps;
assign(MapMacros, _mapMacros);

type arrays = {
	readonly [k in keyof ReadonlyArray<defined>]?: <T extends defined>(
		array: ReadonlyArray<T>,
		...args: Parameters<ReadonlyArray<T>[k]>
	) => ReturnType<ReadonlyArray<T>[k]>;
};
export const ArrayMacros = {} as typeof _arrayMacros;
const _arrayMacros = {
	flatmap: <T extends defined, TOut extends defined>(
		array: readonly T[],
		func: (item: T) => readonly TOut[],
	): TOut[] => {
		const result: TOut[] = [];
		for (const item of array) {
			for (const v of func(item)) {
				result.push(v);
			}
		}

		return result;
	},
	mapToSet: <T extends defined, TOut extends defined>(array: readonly T[], func: (item: T) => TOut): Set<TOut> => {
		const result = new Set<TOut>();
		for (const item of array) {
			result.add(func(item));
		}

		return result;
	},

	groupBy: <TKey extends defined, T extends defined>(
		array: readonly T[],
		keyfunc: (value: T) => TKey,
	): Map<TKey, T[]> => {
		const groups = new Map<TKey, T[]>();
		for (const value of array) {
			const key = keyfunc(value);
			if (!groups.get(key)) {
				groups.set(key, []);
			}

			groups.get(key)?.push(value);
		}

		return groups;
	},

	except: <T extends defined>(array: readonly T[], items: readonly T[]): T[] => {
		const result = [...array];
		for (const item of items) {
			result.remove(result.indexOf(item));
		}

		return result;
	},

	count: <T extends defined>(array: readonly T[], func: (value: T) => boolean): number => {
		let count = 0;
		for (const value of array) {
			if (func(value)) {
				count++;
			}
		}

		return count;
	},
	all: <T extends defined>(array: readonly T[], func: (value: T) => boolean): boolean => {
		return !array.any((v) => !func(v));
	},
	any: <T extends defined>(array: readonly T[], func: (value: T) => boolean): boolean => {
		return array.find(func) !== undefined;
	},
} satisfies arrays;
assign(ArrayMacros, _arrayMacros);
