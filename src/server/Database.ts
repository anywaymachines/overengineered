import Objects from "shared/Objects";

export abstract class DbBase<T> {
	private readonly datastore;
	private readonly cache: Record<string, { changed: boolean; value: T }> = {};

	constructor(datastore: DataStore) {
		this.datastore = datastore;
	}

	protected abstract createDefault(): T;
	protected abstract deserialize(data: string): T;
	protected abstract serialize(data: T): string;

	public get(key: string) {
		return (this.cache[key] ??= this.load(key)).value;
	}

	public set(key: string, value: T) {
		this.cache[key] = { changed: true, value };
	}

	private load(key: string) {
		const [response] = this.datastore.GetAsync<string>(key);
		if (response !== undefined) {
			return (this.cache[key] = { changed: false, value: this.deserialize(response) });
		}

		return { changed: false, value: this.createDefault() };
	}

	public loadedUnsavedEntries() {
		return Objects.entries(this.cache).filter((entry) => entry[1].changed);
	}

	/** Removes an entry from the cache */
	public free(key: string) {
		delete this.cache[key];
	}

	/** Clears tha cache */
	public freeAll() {
		for (const key of Objects.keys(this.cache)) {
			delete this.cache[key];
		}
	}

	/** Saves an entry if it's not changed */
	public save(key: string) {
		const value = this.cache[key];
		if (!value || !value.changed) return;

		// delay between saves?
		this.datastore.SetAsync(key, this.serialize(value.value));
		value.changed = false;
	}

	public saveChanged() {
		for (const [key, value] of Objects.entries(this.cache)) {
			if (!value.changed) continue;

			// delay between saves?
			this.datastore.SetAsync(key, this.serialize(value.value));
			value.changed = false;
		}
	}
}

export class Db<T> extends DbBase<T> {
	private readonly createDefaultFunc;
	private readonly serializeFunc;
	private readonly deserializeFunc;

	constructor(
		datastore: DataStore,
		createDefaultFunc: () => T,
		serializeFunc: (data: T) => string,
		deserializeFunc: (data: string) => T,
	) {
		super(datastore);
		this.createDefaultFunc = createDefaultFunc;
		this.serializeFunc = serializeFunc;
		this.deserializeFunc = deserializeFunc;
	}

	protected createDefault(): T {
		return this.createDefaultFunc();
	}

	protected deserialize(data: string): T {
		return this.deserializeFunc(data);
	}

	protected serialize(data: T): string {
		return this.serializeFunc(data);
	}
}
