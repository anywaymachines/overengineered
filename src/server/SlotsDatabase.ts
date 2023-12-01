import { DataStoreService, HttpService, Players } from "@rbxts/services";
import BlocksSerializer, { SerializedBlock } from "./plots/BlocksSerializer";
import Logger from "shared/Logger";
import Objects from "shared/Objects";
import SharedPlots from "shared/building/SharedPlots";

export type SlotMeta = {
	readonly index: number;
	readonly name: string;
	readonly color: SerializedColor;
	readonly blocks: number;
};

abstract class DbBase<T> {
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

class Db<T> extends DbBase<T> {
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

export class SlotsDatabase {
	public static readonly instance = new SlotsDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");
	private readonly metadb;
	private readonly blocksdb;

	constructor() {
		this.metadb = new Db<readonly SlotMeta[]>(
			this.datastore,
			() => [],
			(data) => HttpService.JSONEncode(data),
			(data) => HttpService.JSONDecode(data) as readonly SlotMeta[],
		);
		this.blocksdb = new Db<readonly SerializedBlock[]>(
			this.datastore,
			() => [],
			(data) => HttpService.JSONEncode(data),
			(data) => HttpService.JSONDecode(data) as readonly SerializedBlock[],
		);

		this.prepare();
	}

	private prepare() {
		Players.PlayerRemoving.Connect((plr) => {
			const key = tostring(plr.UserId);
			this.metadb.save(key);
			this.metadb.free(key);

			for (const [key] of this.blocksdb.loadedUnsavedEntries()) {
				if (key.find(key + "_")[0] === undefined) {
					continue;
				}

				Logger.info("Saving " + key);
				this.blocksdb.save(key);
				this.blocksdb.free(key);
			}
		});

		game.BindToClose(() => {
			Logger.info("Game termination detected");

			this.metadb.saveChanged();
			this.metadb.freeAll();
			this.blocksdb.saveChanged();
			this.blocksdb.freeAll();
		});
	}

	public getMeta(userId: number) {
		return this.metadb.get(tostring(userId));
	}
	public setMeta(userId: number, meta: readonly SlotMeta[]) {
		const slots: SlotMeta[] = [];

		const indices: number[] = [];
		for (let i = meta.size() - 1; i >= 0; i--) {
			const slot = meta[i];
			if (indices.includes(slot.index)) {
				continue;
			}

			indices.push(slot.index);
			slots.push(slot);
		}

		this.metadb.set(tostring(userId), slots);
	}

	private toKey(userId: number, index: number) {
		return `${userId}_${index}`;
	}
	public getBlocks(userId: number, index: number) {
		return this.blocksdb.get(this.toKey(userId, index)) as readonly SerializedBlock[] | undefined;
	}
	public setBlocks(userId: number, index: number, blocks: readonly SerializedBlock[]) {
		this.blocksdb.set(this.toKey(userId, index), blocks);

		const meta = [...SlotsDatabase.instance.getMeta(userId)];
		meta.push({
			...meta.find((s) => s.index === index)!,
			blocks: blocks.size(),
		});

		SlotsDatabase.instance.setMeta(userId, meta);
	}

	public setSlot(
		userid: number,
		index: number,
		slot: (existing: SlotMeta | undefined) => SlotMeta,
		saveBlocks: boolean,
	) {
		const meta = [...SlotsDatabase.instance.getMeta(userid)];

		meta.push(slot(meta.find((s) => s.index === index)));
		SlotsDatabase.instance.setMeta(userid, meta);

		let blocksCount: number | undefined = undefined;
		if (saveBlocks) {
			const plot = SharedPlots.getPlotByOwnerID(userid);
			const blocks = BlocksSerializer.serialize(plot);
			SlotsDatabase.instance.setBlocks(userid, index, blocks);

			blocksCount = blocks.size();
		}

		return blocksCount;
	}
}
