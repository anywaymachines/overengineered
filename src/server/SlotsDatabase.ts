import { DataStoreService, Players } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import SlotsMeta from "../shared/SlotsMeta";
import { Db } from "./Database";
import PlayerDatabase from "./PlayerDatabase";
import BlocksSerializer from "./plots/BlocksSerializer";
import ServerPlots from "./plots/ServerPlots";

export default class SlotsDatabase {
	public static readonly instance = new SlotsDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");
	private readonly blocksdb;

	constructor() {
		this.blocksdb = new Db<string | undefined>(
			this.datastore,
			() => undefined,
			(data) => data,
			(data) => data,
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
		const player = Players.GetPlayerByUserId(userId);
		if (!player) return;

		if (index >= 0 && index < GameDefinitions.getMaxSlots(player, pdata.purchasedSlots ?? 0)) {
			return;
		}

		throw "Invalid slot index " + index;
	}

	private getMeta(userId: number) {
		return PlayerDatabase.instance.get(tostring(userId)).slots ?? [];
	}
	private setMeta(userId: number, slots: readonly SlotMeta[]) {
		PlayerDatabase.instance.set(tostring(userId), {
			...PlayerDatabase.instance.get(tostring(userId)),
			slots,
		});
	}

	private toKey(userId: number, index: number) {
		return `${userId}_${index}`;
	}
	public getBlocks(userId: number, index: number) {
		this.ensureValidSlotIndex(userId, index);
		return this.blocksdb.get(this.toKey(userId, index)) as string | undefined;
	}
	public setBlocks(userId: number, index: number, blocks: string, blockCount: number) {
		this.ensureValidSlotIndex(userId, index);
		this.blocksdb.set(this.toKey(userId, index), blocks);

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, { ...SlotsMeta.get(meta, index), blocks: blockCount, size: blocks.size(), index });
		this.setMeta(userId, meta);
	}

	public update(
		userId: number,
		index: number,
		update: (meta: readonly SlotMeta[]) => readonly SlotMeta[],
		saveBlocks: boolean,
	) {
		this.ensureValidSlotIndex(userId, index);

		const meta = update(this.getMeta(userId));
		this.setMeta(userId, meta);

		let blocksCount: number | undefined = undefined;
		let size: number | undefined = undefined;
		if (saveBlocks) {
			const plot = SharedPlots.getPlotByOwnerID(userId);
			const blocks = BlocksSerializer.serialize(plot);
			blocksCount = SharedPlots.getPlotBlocks(plot).GetChildren().size();

			this.setBlocks(userId, index, blocks, blocksCount);
			size = blocks.size();
		}

		return { blocks: blocksCount, size: size };
	}

	/** @deprecated don't use */
	triggerFullUpgrade() {
		const pager = this.datastore.ListKeysAsync();
		const ids: string[] = [];

		while (!pager.IsFinished) {
			for (const item of pager.GetCurrentPage() as DataStoreKey[]) {
				ids.push(item.KeyName);
			}
			try {
				pager.AdvanceToNextPageAsync();
			} catch {
				// empty
			}
		}

		for (const id of ids) {
			try {
				const bs = this.blocksdb.get(id) as string | undefined;
				if (bs === undefined) continue;

				const plot = SharedPlots.getPlotByOwnerID(Players.GetPlayers()[0].UserId);
				ServerPlots.clearAllBlocks(plot);

				BlocksSerializer.deserialize(bs, plot);
				const serialized = BlocksSerializer.serialize(plot);

				this.blocksdb.set(id, serialized);
			} catch (err) {
				print(err);
			}
		}

		this.blocksdb.saveChanged();
	}
}
