import { DataStoreService, Players } from "@rbxts/services";
import { ServerBuilding } from "server/building/ServerBuilding";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import GameDefinitions from "shared/data/GameDefinitions";
import { Db } from "./Database";
import PlayerDatabase from "./PlayerDatabase";

export default class SlotDatabase {
	static readonly instance = new SlotDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");
	private readonly blocksdb;

	constructor() {
		this.blocksdb = new Db<string | undefined>(
			this.datastore,
			() => undefined,
			(data) => data,
			(data) => data,
		);

		Players.PlayerRemoving.Connect((plr) => {
			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

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
	getBlocks(userId: number, index: number) {
		this.ensureValidSlotIndex(userId, index);
		return this.blocksdb.get(this.toKey(userId, index)) as string | undefined;
	}
	setBlocks(userId: number, index: number, blocks: string, blockCount: number) {
		this.ensureValidSlotIndex(userId, index);
		this.blocksdb.set(this.toKey(userId, index), blocks);

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, { ...SlotsMeta.get(meta, index), blocks: blockCount, size: blocks.size(), index });
		this.setMeta(userId, meta);
	}

	update(
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
				ServerBuilding.clearPlot(plot);

				BlocksSerializer.deserialize(bs, plot);
				const serialized = BlocksSerializer.serialize(plot);

				this.blocksdb.set(id, serialized);
			} catch (err) {
				Logger.error(err as string);
			}
		}

		this.blocksdb.saveChanged();
	}
}
