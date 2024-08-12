import { Element } from "shared/Element";
import { Objects } from "shared/fixes/objects";
import { Throttler } from "shared/Throttler";

type DbStoredValue<T> = {
	value: T;
	changed: boolean;
	lastAccessedTime: number;
	lastSaveTime: number;
};
export abstract class DbBase<T> {
	private readonly datastore;
	private readonly cache: { [k in string]: DbStoredValue<T> } = {};
	private readonly currentlyLoading: Record<string, Promise<T>> = {};

	constructor(datastore: DataStore | undefined) {
		this.datastore = datastore;

		game.BindToClose(() => {
			$log("Game termination detected");

			this.saveChanged();
			this.freeAll();
		});

		task.spawn(() => {
			const freeTimeoutSec = 5 * 60;
			const saveTimeoutSec = 9 * 60;
			$debug(`Initializing db ${this} cache auto-freeing after ${freeTimeoutSec} sec of inactivity`);
			$debug(`Initializing db ${this} cache auto-saving with the interval of ${saveTimeoutSec} sec`);

			while (true as boolean) {
				task.wait(1);

				const freeTimeCutoff = os.time() - freeTimeoutSec;
				const saveTimeCutoff = os.time() - saveTimeoutSec;

				for (const [key, item] of [...asMap(this.cache)]) {
					if (item.lastAccessedTime < freeTimeCutoff) {
						$debug(`Freeing db ${this} key ${key} after ${freeTimeoutSec} sec of inactivity`);

						this.save(key);
						this.free(key);
						continue;
					}

					if (item.lastSaveTime < saveTimeCutoff) {
						$debug(`Auto-saving db ${this} key ${key} after ${saveTimeoutSec} sec`);
						this.save(key);
					}
				}
			}
		});
	}

	protected abstract createDefault(): T;
	protected abstract deserialize(data: string): T;
	protected abstract serialize(data: T): string | undefined;

	get(key: string): T {
		if (key in this.cache) {
			const value = this.cache[key];
			value.lastAccessedTime = os.time();

			return value.value;
		}

		if (key in this.currentlyLoading) {
			return Objects.awaitThrow(this.currentlyLoading[key]);
		}

		let res: (value: T) => void = undefined!;
		const promise = new Promise<T>((resolve) => (res = resolve));
		this.currentlyLoading[key] = promise;

		try {
			const loaded = this.load(key);
			this.cache[key] = loaded;
			res(loaded.value);

			return loaded.value;
		} finally {
			delete this.currentlyLoading[key];
		}
	}

	set(key: string, value: T) {
		const time = os.time();
		this.cache[key] = {
			changed: true,
			lastAccessedTime: time,
			value,
			lastSaveTime: time,
		};
	}

	private readonly getOptions = Element.create("DataStoreGetOptions", { UseCache: false });
	private load(key: string): DbStoredValue<T> {
		if (!this.datastore) {
			const time = os.time();
			return {
				value: this.createDefault(),
				changed: false,
				lastAccessedTime: time,
				lastSaveTime: time,
			};
		}

		const req = Throttler.retryOnFail<string | undefined>(
			10,
			1,
			() => this.datastore!.GetAsync<string>(key, this.getOptions)[0],
		);

		if (req.success) {
			if (req.message !== undefined) {
				const time = os.time();
				return (this.cache[key] = {
					value: this.deserialize(req.message),
					changed: false,
					lastAccessedTime: time,
					lastSaveTime: time,
				});
			}
		} else {
			$err(req.error_message);
		}

		const time = os.time();
		return {
			value: this.createDefault(),
			changed: false,
			lastAccessedTime: time,
			lastSaveTime: time,
		};
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
		for (const [key, _] of pairs(this.cache)) {
			delete this.cache[key];
		}
	}

	/** Saves an entry if it's not changed */
	save(key: string) {
		const value = this.cache[key];
		if (!value) return;

		value.lastSaveTime = os.time();
		if (!value.changed) return;

		// delay between saves?
		value.changed = false;
		if (!this.datastore) return;

		const req = Throttler.retryOnFail(10, 1, () => this.datastore!.SetAsync(key, this.serialize(value.value)));
		if (!req.success) {
			$err(req.error_message);
		}
	}

	saveChanged() {
		for (const [key] of pairs(this.cache)) {
			this.save(key);
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
