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

	/** Custom `pairs` with a better typing */
	export const pairs_ = asMap;

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

	// Explanation for the next methods
	/* In lua:
	`Record<K, V>` (any object) is represented as a table with keys K and values V
	`Map<K, V>` is represented exactly the same as Record<K, V>
	`Set<V>` is represented as a table with keys V and values `true`
	`V[]` is represented as a table with keys `number` and values V

	Or, simpler,
	`Map<K, V>` = `Record<K, V>`
	`Set<V>` = `Record<V, true>`
	`V[]` = `Record<number, V>`

	So we can safely (excluding the 1-based array indexing shenanigans) convert between them to use methods from other types
	*/

	//

	type ObjectKeys = string | number | symbol;
	type ReadonlyRecord<K extends ObjectKeys, V> = Readonly<Record<K, V>>;

	export function asObject<V>(map: readonly V[]): object & ReadonlyRecord<number, V>;
	export function asObject<V>(map: V[]): object & Record<number, V>;

	export function asObject<V extends ObjectKeys>(map: Set<V>): object & Record<V, true>;
	export function asObject<V extends ObjectKeys>(map: ReadonlySet<V>): object & ReadonlyRecord<V, true>;

	export function asObject<K extends ObjectKeys, V>(map: Map<K, V>): object & Record<K, V>;
	export function asObject<K extends ObjectKeys, V>(map: ReadonlyMap<K, V>): object & ReadonlyRecord<K, V>;

	export function asObject<K extends ObjectKeys, V>(
		map: ReadonlyMap<K, V> | ReadonlySet<V> | readonly V[],
	): object & Record<K, V> {
		return map as object & Record<K, V>;
	}

	//

	export function asMap<V>(object: V[]): Map<number, V & defined>;
	export function asMap<V>(object: readonly V[]): ReadonlyMap<number, V & defined>;

	export function asMap<V extends defined>(object: Set<V>): Map<V, true>;
	export function asMap<V extends defined>(object: ReadonlySet<V>): ReadonlyMap<V, true>;

	export function asMap<T extends object>(object: T): Map<keyof T, T[keyof T] & defined>;
	export function asMap<T extends object>(object: T): ReadonlyMap<keyof T, T[keyof T] & defined>;

	export function asMap<K extends ObjectKeys, V>(
		object: (object & ReadonlyRecord<K, V>) | ReadonlySet<V> | readonly V[],
	): Map<K, V> {
		return object as Map<K, V>;
	}

	//

	export function asSet(object: true[]): Set<number>;
	export function asSet(object: readonly true[]): ReadonlySet<number>;

	export function asSet<K extends defined>(object: Map<K, true>): Set<K>;
	export function asSet<K extends defined>(object: ReadonlyMap<K, true>): ReadonlySet<K>;

	export function asSet<K extends ObjectKeys>(object: object & Record<K, true>): Set<K>;
	export function asSet<K extends ObjectKeys>(object: object & ReadonlyRecord<K, true>): ReadonlySet<K>;

	export function asSet<K extends ObjectKeys>(
		object: (object & ReadonlyRecord<K, true>) | ReadonlyMap<K, true> | readonly true[],
	): Set<K> {
		return object as Set<K>;
	}

	//

	export function asArray(object: Set<number>): true[];
	export function asArray(object: ReadonlySet<number>): readonly true[];

	export function asArray<V>(object: Map<number, V>): V[];
	export function asArray<V>(object: ReadonlyMap<number, V>): readonly V[];

	export function asArray<V>(object: object & Record<number, V>): V[];
	export function asArray<V>(object: object & ReadonlyRecord<number, V>): readonly V[];

	export function asArray<K extends ObjectKeys, V>(
		object: (object & ReadonlyRecord<K, V>) | ReadonlyMap<K, V> | ReadonlySet<V>,
	): V[] {
		return object as V[];
	}
}

export const { pairs_, asObject, asMap, asSet, asArray } = Objects;
