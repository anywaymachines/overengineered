import { $defineCallMacros } from "rbxts-transformer-macros";

declare global {
	interface ReadonlySet<T> {
		filter(func: (item: T) => boolean): T[];
		filterToSet(func: (item: T) => boolean): Set<T>;
		map<TOut extends defined>(func: (item: T) => TOut): TOut[];
		mapToSet<TOut extends defined>(func: (item: T) => TOut): Set<TOut>;
		flatmap<TOut extends defined>(func: (item: T) => readonly TOut[]): TOut[];
		flatmapToSet<TOut extends defined>(func: (item: T) => readonly TOut[]): Set<TOut>;
		find(func: (item: T) => boolean): T | undefined;
		groupBy<TKey extends defined, T extends defined>(keyfunc: (value: T) => TKey): Map<TKey, T[]>;

		all(func: (value: T) => boolean): boolean;
		any(func: (value: T) => boolean): boolean;
	}
}

type sets = {
	readonly [k in keyof ReadonlySet<defined>]?: <T extends defined>(
		set: ReadonlySet<T>,
		...args: Parameters<ReadonlySet<T>[k]>
	) => ReturnType<ReadonlySet<T>[k]>;
};
export const SetMacros = $defineCallMacros<ReadonlySet<defined>>({
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

	all: <T extends defined>(array: ReadonlySet<T>, func: (value: T) => boolean): boolean => {
		return array.find((v) => !func(v)) === undefined;
	},
	any: <T extends defined>(array: ReadonlySet<T>, func: (value: T) => boolean): boolean => {
		return array.find(func) !== undefined;
	},
} satisfies sets);

//

declare global {
	interface ReadonlyMap<K, V> {
		keys(): K[];
		values(): V[];

		filter(func: (key: K, value: V) => boolean): Map<K, V>;
		map<TOut extends defined>(func: (key: K, value: V) => TOut): TOut[];
		flatmap<TOut extends defined>(func: (key: K, value: V) => readonly TOut[]): TOut[];
		find(func: (key: K, value: V) => boolean): readonly [key: K, value: V] | undefined;
	}
}

type maps = {
	readonly [k in keyof ReadonlyMap<defined, defined>]?: <K extends defined, V extends defined>(
		map: ReadonlyMap<K, V>,
		...args: Parameters<ReadonlyMap<K, V>[k]>
	) => ReturnType<ReadonlyMap<K, V>[k]>;
};
export const MapMacros = $defineCallMacros<ReadonlyMap<defined, defined>>({
	keys: <K extends defined, V extends defined>(map: ReadonlyMap<K, V>): K[] => {
		return map.map((k, v) => k);
	},
	values: <K extends defined, V extends defined>(map: ReadonlyMap<K, V>): V[] => {
		return map.map((k, v) => v);
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
} satisfies maps);

//

declare global {
	interface ReadonlyArray<T> {
		flatmap<TOut extends defined>(func: (item: T) => readonly TOut[]): TOut[];
		groupBy<TKey extends defined>(keyfunc: (value: T) => TKey): Map<TKey, T[]>;

		all(func: (value: T) => boolean): boolean;
		any(func: (value: T) => boolean): boolean;
	}
}

type arrays = {
	readonly [k in keyof ReadonlyArray<defined>]?: <T extends defined>(
		array: ReadonlyArray<T>,
		...args: Parameters<ReadonlyArray<T>[k]>
	) => ReturnType<ReadonlyArray<T>[k]>;
};
export const ArrayMacros = $defineCallMacros<ReadonlyArray<defined>>({
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

	all: <T extends defined>(array: readonly T[], func: (value: T) => boolean): boolean => {
		return array.find((v) => !func(v)) === undefined;
	},
	any: <T extends defined>(array: readonly T[], func: (value: T) => boolean): boolean => {
		return array.find(func) !== undefined;
	},
} satisfies arrays);
