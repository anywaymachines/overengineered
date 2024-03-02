import { $defineCallMacros } from "rbxts-transformer-macros";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MacroList<T> = { readonly [key: string]: (this: T, ...args: any[]) => unknown };
type E<T> = { readonly [k in keyof T]?: (this: T, ...args: Parameters<T[k]>) => ReturnType<T[k]> };

declare global {
	interface ReadonlySet<T> {
		filter(func: (item: T) => boolean): T[];
		filterToSet(func: (item: T) => boolean): Set<T>;
	}
}
const setMacros = {
	filter(func: (item: defined) => boolean): defined[] {
		const result: defined[] = [];
		for (const value of this) {
			if (!func(value)) continue;
			result.push(value);
		}

		return result;
	},
	filterToSet(func: (item: defined) => boolean): Set<defined> {
		const result = new Set<defined>();
		for (const value of this) {
			if (!func(value)) continue;
			result.add(value);
		}

		return result;
	},
} as const satisfies E<ReadonlySet<defined>>;
export const SetMacros = $defineCallMacros<ReadonlySet<defined>>(setMacros);

//

declare global {
	interface ReadonlyMap<K, V> {
		filter(func: (key: K, value: V) => boolean): Map<K, V>;
	}
}
const mapMacros = {
	filter(func: (key: defined, value: defined) => boolean): Map<defined, defined> {
		const result = new Map<defined, defined>();
		for (const [key, value] of this) {
			if (!func(key, value)) continue;
			result.set(key, value);
		}

		return result;
	},
} as const satisfies MacroList<ReadonlyMap<defined, defined>>;
export const MapMacros = $defineCallMacros<ReadonlyMap<defined, defined>>(mapMacros);

//

export const Arrays = {
	ofMap: {
		keys: <TKey extends defined, TValue extends defined>(map: ReadonlyMap<TKey, TValue>): TKey[] => {
			return Arrays.ofMap.map(map, (k, v) => k);
		},
		values: <TKey extends defined, TValue extends defined>(map: ReadonlyMap<TKey, TValue>): TValue[] => {
			return Arrays.ofMap.map(map, (k, v) => v);
		},

		flatmap<TKey extends defined, TValue extends defined, TOut extends defined>(
			array: ReadonlyMap<TKey, TValue>,
			mapfunc: (key: TKey, value: TValue) => readonly TOut[],
		): TOut[] {
			const result: TOut[] = [];
			for (const [key, value] of array) {
				for (const v of mapfunc(key, value)) {
					result.push(v);
				}
			}

			return result;
		},
		map<TKey extends defined, TValue extends defined, TOut extends defined>(
			map: ReadonlyMap<TKey, TValue>,
			func: (key: TKey, value: TValue) => TOut,
		): TOut[] {
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
			for (const [key, value] of map) {
				if (!func(key, value)) continue;
				return [key, value];
			}

			return undefined;
		},
	},
	ofSet: {
		flatmap<TValue extends defined, TOut extends defined>(
			array: ReadonlySet<TValue>,
			mapfunc: (value: TValue) => readonly TOut[],
		): TOut[] {
			const result: TOut[] = [];
			for (const value of array) {
				for (const v of mapfunc(value)) {
					result.push(v);
				}
			}

			return result;
		},
		map<TValue extends defined, TOut extends defined>(
			map: ReadonlySet<TValue>,
			func: (value: TValue) => TOut,
		): TOut[] {
			const result: TOut[] = [];
			for (const value of map) {
				result.push(func(value));
			}

			return result;
		},
		groupBy<TValue extends defined, TOut>(
			values: ReadonlySet<TValue>,
			keyfunc: (value: TValue) => TOut,
		): Map<TOut, TValue[]> {
			const groups = new Map<TOut, TValue[]>();
			for (const value of values) {
				const key = keyfunc(value);
				if (!groups.get(key)) {
					groups.set(key, []);
				}

				groups.get(key)?.push(value);
			}

			return groups;
		},

		filter<TValue extends defined>(map: ReadonlySet<TValue>, func: (value: TValue) => boolean): TValue[] {
			const result: TValue[] = [];
			for (const value of map) {
				if (!func(value)) continue;
				result.push(value);
			}

			return result;
		},

		find<TValue extends defined>(map: ReadonlySet<TValue>, func: (value: TValue) => boolean): TValue | undefined {
			for (const value of map) {
				if (!func(value)) continue;
				return value;
			}

			return undefined;
		},

		removeAll<TValue extends defined>(values: Set<TValue>, toRemove: ReadonlySet<TValue>): void {
			for (const remove of toRemove) {
				values.delete(remove);
			}
		},
		intersect<TValue extends defined>(left: Set<TValue>, right: ReadonlySet<TValue>): ReadonlySet<TValue> {
			const result = new Set<TValue>();
			for (const item of left) {
				if (right.has(item)) {
					result.add(item);
				}
			}
			for (const item of right) {
				if (left.has(item)) {
					result.add(item);
				}
			}

			return result;
		},
	},

	empty: [],

	mapSet<TValue extends defined, TOut extends defined>(
		array: ReadonlySet<TValue>,
		mapfunc: (value: TValue) => TOut,
	): TOut[] {
		return this.ofSet.map(array, mapfunc);
	},
	groupBySet<T extends defined, TOut>(values: ReadonlySet<T>, keyfunc: (value: T) => TOut) {
		return this.ofSet.groupBy(values, keyfunc);
	},

	ofType<TElements extends defined, TFilter extends TElements>(
		array: readonly TElements[],
		filterfunbc: { new (...args: readonly never[]): TFilter },
	): TFilter[] {
		return array.filter((e) => e instanceof filterfunbc) as TFilter[];
	},

	map<TKey extends defined, TValue extends defined, TOut extends defined>(
		array: ReadonlyMap<TKey, TValue>,
		mapfunc: (key: TKey, value: TValue) => TOut,
	): TOut[] {
		return this.ofMap.map(array, mapfunc);
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
	getLast<T extends defined>(values: readonly T[]): T | undefined {
		return values[values.size() - 1];
	},

	any<T extends defined>(values: readonly T[], func: (value: T) => boolean): boolean {
		return values.find(func) !== undefined;
	},
	all<T extends defined>(values: readonly T[], func: (value: T) => boolean): boolean {
		return values.find((v) => !func(v)) === undefined;
	},
} as const;
