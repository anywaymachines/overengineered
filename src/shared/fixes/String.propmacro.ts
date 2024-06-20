// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove
const _ = () => [StringMacros];

declare global {
	interface String {
		trim(this: string): string;
	}
}
export const StringMacros: PropertyMacros<String> = {
	trim: (str: String): string => {
		return (str as string).gsub("^%s*(.-)%s*$", "%1")[0];
	},
};

declare global {
	interface ReadonlyMap<K, V> {
		keys(this: ReadonlyMap<K, V>): K[];
		values(this: ReadonlyMap<K, V>): (V & defined)[];
		count(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): number;

		filter(this: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): Map<K, V>;
		map<TOut extends defined>(this: ReadonlyMap<K, V>, func: (key: K, value: V) => TOut): TOut[];
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
		): Map<TKey, TValue>;
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
	): Map<TKey, TValue> => {
		const result = new Map<TKey, TValue>();
		for (const item of array) {
			const [k, v] = func(item);
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
