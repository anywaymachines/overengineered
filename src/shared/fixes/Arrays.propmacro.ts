// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove
const _ = () => [SetMacros, MapMacros, ArrayMacros];

declare global {
	interface ReadonlySet<T> {
		filter(this: ReadonlySet<T>, func: (item: T) => boolean): T[];
		filterToSet(this: ReadonlySet<T>, func: (item: T) => boolean): Set<T>;
		map<TOut extends defined>(this: ReadonlySet<T>, func: (item: T) => TOut): TOut[];
		mapToSet<TOut extends defined>(this: ReadonlySet<T>, func: (item: T) => TOut): Set<TOut>;
		flatmap<TOut extends defined>(this: ReadonlySet<T>, func: (item: T) => readonly TOut[]): TOut[];
		flatmapToSet<TOut extends defined>(this: ReadonlySet<T>, func: (item: T) => readonly TOut[]): Set<TOut>;
		find(this: ReadonlySet<T>, func: (item: T) => boolean): T | undefined;
		groupBy<TKey extends defined, T extends defined>(
			this: ReadonlySet<T>,
			keyfunc: (value: T) => TKey,
		): Map<TKey, T[]>;

		count(this: ReadonlySet<T>, func: (value: T) => boolean): number;
		all(this: ReadonlySet<T>, func: (value: T) => boolean): boolean;
		any(this: ReadonlySet<T>, func: (value: T) => boolean): boolean;
	}
}
export const SetMacros: PropertyMacros<ReadonlySet<defined>> = {
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
};

declare global {
	interface ReadonlyMap<K, V> {
		keys(this: ReadonlyMap<K, V>): K[];
		values(this: ReadonlyMap<K, V>): (V & defined)[];
		count(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): number;

		filter(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): Map<K, V>;
		map<TOut extends defined>(this: ReadonlyMap<K, V>, func: (key: K, value: V) => TOut): TOut[];
		mapToMap<TK extends defined, TOut extends defined>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V) => LuaTuple<[TK, TOut]>,
		): Map<TK, TOut>;
		flatmap<TOut extends defined>(this: ReadonlyMap<K, V>, func: (key: K, value: V) => readonly TOut[]): TOut[];
		find(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): readonly [key: K, value: V] | undefined;
		findKey(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): K | undefined;
		findValue(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): V | undefined;

		all(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): boolean;
		any(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): boolean;
	}
}
export const MapMacros: PropertyMacros<ReadonlyMap<defined, defined>> = {
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
	mapToMap: <K extends defined, V extends defined, TK extends defined, TOut extends defined>(
		map: ReadonlyMap<K, V>,
		func: (key: K, value: V) => LuaTuple<[TK, TOut]>,
	): Map<TK, TOut> => {
		const result = new Map<TK, TOut>();
		for (const [key, value] of map) {
			const [k, v] = func(key, value);
			result.set(k, v);
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
};

declare global {
	interface ReadonlyArray<T> {
		mapToMap<TKey extends defined, TValue>(
			this: ReadonlyArray<defined>,
			func: (item: T) => LuaTuple<[key: TKey, value: TValue]>,
		): Map<TKey, TValue & defined>;
		flatmap<TOut extends defined>(this: ReadonlyArray<defined>, func: (item: T) => readonly TOut[]): TOut[];
		mapToSet<TOut extends defined>(this: ReadonlyArray<defined>, func: (item: T) => TOut): Set<TOut>;
		groupBy<TKey extends defined>(this: ReadonlyArray<defined>, keyfunc: (value: T) => TKey): Map<TKey, T[]>;
		except(this: ReadonlyArray<defined>, items: readonly T[]): T[];

		count(this: ReadonlyArray<defined>, func: (value: T) => boolean): number;
		all(this: ReadonlyArray<defined>, func: (value: T) => boolean): boolean;
		any(this: ReadonlyArray<defined>, func: (value: T) => boolean): boolean;
	}
}
export const ArrayMacros: PropertyMacros<ReadonlyArray<defined>> = {
	mapToMap: <T extends defined, TKey extends defined, TValue>(
		array: readonly T[],
		func: (item: T) => LuaTuple<[key: TKey, value: TValue]>,
	): Map<TKey, TValue & defined> => {
		const result = new Map<TKey, TValue & defined>();
		for (const item of array) {
			const [k, v] = func(item);
			if (!v) continue;

			result.set(k, v);
		}

		return result;
	},
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
};
