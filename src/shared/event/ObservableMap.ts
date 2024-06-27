import { Signal } from "shared/event/Signal";
import type { ReadonlySignal } from "shared/event/Signal";

export interface ReadonlyObservableMap<K extends defined, V extends defined> {
	readonly changed: ReadonlySignal<(key: K, value: V | undefined) => void>;

	size(): number;
	getAll(): ReadonlyMap<K, V>;
}

export class ObservableMap<K extends defined, V extends defined> implements ReadonlyObservableMap<K, V> {
	protected readonly _changed = new Signal<(key: K, value: V | undefined) => void>();
	readonly changed = this._changed.asReadonly();
	private readonly map = new Map<K, V>();

	size(): number {
		return this.map.size();
	}
	getAll(): ReadonlyMap<K, V> {
		return this.map;
	}
	get(key: K): V | undefined {
		return this.map.get(key);
	}

	/** Clear the collection and add the provided items */
	setRange(items: ReadonlyMap<K, V>) {
		this.clear();
		for (const [k, v] of items) {
			this.set(k, v);
		}
	}

	set(key: K, value: V) {
		this.map.set(key, value);
		this._changed.Fire(key, value);
	}

	/** Remove the provided items */
	remove(key: K) {
		this.map.delete(key);
		this._changed.Fire(key, undefined);
	}
	/** Clear the collection */
	clear() {
		const keys = this.map.keys();
		this.map.clear();

		for (const k of keys) {
			this._changed.Fire(k, undefined);
		}
	}

	asReadonly(): ReadonlyObservableMap<K, V> {
		return this;
	}
}
