import { Element } from "shared/Element";
import { Logger } from "shared/Logger";
import { Objects } from "shared/fixes/objects";

const logger = new Logger("Database");

export abstract class DbBase<T> {
	private readonly datastore;
	private readonly cache: Record<string, { changed: boolean; value: T }> = {};

	constructor(datastore: DataStore | undefined) {
		this.datastore = datastore;

		game.BindToClose(() => {
			logger.info("Game termination detected");

			this.saveChanged();
			this.freeAll();
		});
	}

	protected abstract createDefault(): T;
	protected abstract deserialize(data: string): T;
	protected abstract serialize(data: T): string | undefined;

	get(key: string) {
		return (this.cache[key] ??= this.load(key)).value;
	}

	set(key: string, value: T) {
		this.cache[key] = { changed: true, value };
	}

	private readonly getOptions = Element.create("DataStoreGetOptions", { UseCache: false });
	private load(key: string) {
		if (!this.datastore) return { changed: false, value: this.createDefault() };

		const [response] = this.datastore.GetAsync<string>(key, this.getOptions);
		if (response !== undefined) {
			return (this.cache[key] = { changed: false, value: this.deserialize(response) });
		}

		return { changed: false, value: this.createDefault() };
	}

	loadedUnsavedEntries() {
		return Objects.entriesArray(this.cache).filter((entry) => entry[1].changed);
	}

	/** Removes an entry from the cache */
	free(key: string) {
		delete this.cache[key];
	}

	/** Clears tha cache */
	freeAll() {
		for (const [key, _] of Objects.pairs_(this.cache)) {
			delete this.cache[key];
		}
	}

	/** Saves an entry if it's not changed */
	save(key: string) {
		const value = this.cache[key];
		if (!value || !value.changed) return;

		// delay between saves?
		value.changed = false;
		if (!this.datastore) return;
		this.datastore.SetAsync(key, this.serialize(value.value));
	}

	saveChanged() {
		for (const [key, value] of Objects.pairs_(this.cache)) {
			if (!value.changed) continue;

			// delay between saves?
			value.changed = false;
			if (!this.datastore) return;
			this.datastore.SetAsync(key, this.serialize(value.value));
		}
	}
}

export class Db<T> extends DbBase<T> {
	private readonly createDefaultFunc;
	private readonly serializeFunc;
	private readonly deserializeFunc;

	constructor(
		datastore: DataStore | undefined,
		createDefaultFunc: () => T,
		serializeFunc: (data: T) => string | undefined,
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

	protected serialize(data: T): string | undefined {
		return this.serializeFunc(data);
	}
}
