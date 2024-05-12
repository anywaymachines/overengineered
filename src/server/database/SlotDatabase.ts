import { DataStoreService, Players } from "@rbxts/services";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { SlotsMeta } from "shared/SlotsMeta";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Db } from "./Database";
import { PlayerDatabase } from "./PlayerDatabase";

export class SlotDatabase {
	static readonly instance = new SlotDatabase();

	private readonly onlinePlayers = new Set<number>();
	private readonly datastore;
	private readonly blocksdb;

	constructor() {
		try {
			this.datastore = DataStoreService.GetDataStore("slots");
		} catch {
			warn("Place datastore is not available. All requests will be dropped.");
		}

		this.blocksdb = new Db<string | undefined>(
			this.datastore,
			() => undefined,
			(data) => data,
			(data) => data,
		);

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			const id = tostring(plr.UserId);

			for (const [key] of this.blocksdb.loadedUnsavedEntries()) {
				if (key.find(id + "_")[0] === undefined) {
					continue;
				}

				$log("Saving " + key);
				this.blocksdb.save(key);
				this.blocksdb.free(key);
			}
		});
	}

	private ensureValidSlotIndex(userId: number, index: number) {
		if (index in SlotsMeta.specialSlots) return;

		const pdata = PlayerDatabase.instance.get(userId);
		const player = Players.GetPlayerByUserId(userId);
		if (!player) return;

		if (index >= 0 && index < GameDefinitions.getMaxSlots(player, pdata.purchasedSlots ?? 0)) {
			return;
		}

		throw "Invalid slot index " + index;
	}

	private getMeta(userId: number) {
		return PlayerDatabase.instance.get(userId).slots ?? [];
	}
	private setMeta(userId: number, slots: readonly SlotMeta[]) {
		PlayerDatabase.instance.set(userId, {
			...PlayerDatabase.instance.get(userId),
			slots,
		});

		if (!this.onlinePlayers.has(userId)) {
			this.blocksdb.save(tostring(userId));
			this.blocksdb.free(tostring(userId));
			$log("SAVING AFTER QUIT2");
		}
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
		SlotsMeta.set(meta, {
			...SlotsMeta.get(meta, index),
			blocks: blockCount,
			size: blocks.size(),
			saveTime: DateTime.now().UnixTimestampMillis,
			index,
		});
		this.setMeta(userId, meta);
	}
	setBlocksFromAnotherSlot(userId: number, index: number, indexfrom: number) {
		this.ensureValidSlotIndex(userId, index);
		this.ensureValidSlotIndex(userId, indexfrom);
		this.blocksdb.set(this.toKey(userId, index), this.getBlocks(userId, indexfrom));

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, { ...SlotsMeta.get(meta, indexfrom), index });
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
			blocksCount = SharedPlots.getPlotComponent(plot).getBlocks().size();

			this.setBlocks(userId, index, blocks, blocksCount);
			size = blocks.size();
		}

		return { blocks: blocksCount, size: size };
	}
}
