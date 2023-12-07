import { DataStoreService, HttpService, Players } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import SlotsMeta from "../shared/SlotsMeta";
import { Db } from "./Database";
import PlayerDatabase from "./PlayerDatabase";
import BlocksSerializer, { SerializedBlock } from "./plots/BlocksSerializer";

export default class SlotsDatabase {
	public static readonly instance = new SlotsDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");
	private readonly blocksdb;

	constructor() {
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
			const id = tostring(plr.UserId);

			for (const [key] of this.blocksdb.loadedUnsavedEntries()) {
				if (key.find(id + "_")[0] === undefined) {
					continue;
				}

				Logger.info("Saving " + key);
				this.blocksdb.save(key);
				this.blocksdb.free(key);
			}
		});
	}

	private ensureValidSlotIndex(userId: number, index: number) {
		if (index === SlotsMeta.autosaveSlotIndex) return;

		const pdata = PlayerDatabase.instance.get(tostring(userId));
		if (index >= 0 && index < GameDefinitions.FREE_SLOTS + (pdata.purchasedSlots ?? 0)) return;

		throw "Invalid slot index " + index;
	}

	private getMeta(userId: number) {
		return SlotsMeta.fromSerialized(PlayerDatabase.instance.get(tostring(userId)).slots ?? []);
	}
	private setMeta(userId: number, meta: SlotsMeta) {
		PlayerDatabase.instance.set(tostring(userId), {
			...PlayerDatabase.instance.get(tostring(userId)),
			slots: meta.toSerialized(),
		});
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
		let size: number | undefined = undefined;
		if (saveBlocks) {
			const plot = SharedPlots.getPlotByOwnerID(userId);
			const blocks = BlocksSerializer.serialize(plot);
			this.setBlocks(userId, index, blocks);

			blocksCount = blocks.size();
			size = HttpService.JSONEncode(blocks).size();
		}

		return { blocks: blocksCount, size: size };
	}
}
