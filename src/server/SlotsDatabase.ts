import { DataStoreService, HttpService, Players } from "@rbxts/services";
import BlocksSerializer, { SerializedBlock } from "./plots/BlocksSerializer";
import Logger from "shared/Logger";
import Objects from "shared/Objects";
import SharedPlots from "shared/building/SharedPlots";
import SlotsMeta from "../shared/SlotsMeta";
import GameDefinitions from "shared/GameDefinitions";
import PlayerDatabase from "./PlayerDatabase";

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

export default class SlotsDatabase {
	public static readonly instance = new SlotsDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");
	private readonly metadb;
	private readonly blocksdb;

	constructor() {
		this.metadb = new Db<SlotsMeta>(
			this.datastore,
			() => new SlotsMeta(),
			(data) => data.serialize(),
			(data) => SlotsMeta.deserialize(data),
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

	private ensureValidSlotIndex(userId: number, index: number) {
		if (index === SlotsMeta.autosaveSlotIndex) return;

		const pdata = PlayerDatabase.instance.get(tostring(userId));
		if (index >= 0 && index < GameDefinitions.FREE_SLOTS + (pdata.purchasedSlots ?? 0)) return;

		throw "Invalid slot index " + index;
	}

	public getAllMeta(userId: number) {
		return this.metadb.get(tostring(userId));
	}
	private getMeta(userId: number) {
		return this.metadb.get(tostring(userId));
	}
	public setMeta(userId: number, meta: SlotsMeta) {
		this.metadb.set(tostring(userId), meta);
	}

	private toKey(userId: number, index: number) {
		return `${userId}_${index}`;
	}
	public getBlocks(userId: number, index: number) {
		this.ensureValidSlotIndex(userId, index);
		return this.blocksdb.get(this.toKey(userId, index)) as readonly SerializedBlock[] | undefined;
	}
	public setBlocks(userId: number, index: number, blocks: readonly SerializedBlock[]) {
		this.ensureValidSlotIndex(userId, index);
		this.blocksdb.set(this.toKey(userId, index), blocks);

		const meta = this.getMeta(userId);
		meta.set(index, { ...meta.get(index), blocks: blocks.size() });
		this.setMeta(userId, meta);
	}

	public update(userId: number, index: number, update: (meta: SlotsMeta) => void, saveBlocks: boolean) {
		this.ensureValidSlotIndex(userId, index);

		const meta = this.getMeta(userId);
		update(meta);
		this.setMeta(userId, meta);

		let blocksCount: number | undefined = undefined;
		if (saveBlocks) {
			const plot = SharedPlots.getPlotByOwnerID(userId);
			const blocks = BlocksSerializer.serialize(plot);
			this.setBlocks(userId, index, blocks);

			blocksCount = blocks.size();
		}

		return blocksCount;
	}
}
