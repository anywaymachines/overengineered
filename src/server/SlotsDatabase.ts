import { DataStoreService, HttpService, Players } from "@rbxts/services";
import { SerializedBlock } from "./plots/BlocksSerializer";
import Logger from "shared/Logger";

export type SlotMeta = {
	name: string;
	color: SerializedColor;
	blocks: number;
};

export class SlotsDatabase {
	public static readonly instance = new SlotsDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("slots");

	private readonly meta_cache: Record<string, SlotMeta[]> = {};
	private readonly blocks_cache: Record<number, Record<number, readonly SerializedBlock[]> | undefined> = {};

	// todo: move
	private readonly player_lastsave: { [userId: number]: number } = {};

	constructor() {
		this.prepare();
	}

	private prepare() {
		Players.PlayerAdded.Connect((plr) => {
			this.loadMeta(plr.UserId);
			this.player_lastsave[plr.UserId] = 0;
		});
		Players.PlayerRemoving.Connect((plr) => {
			this.saveMeta(plr.UserId);
			delete this.player_lastsave[plr.UserId];
		});

		game.BindToClose(() => {
			Logger.info("Game termination detected");
			const players = Players.GetPlayers();

			for (let i = 0; i < players.size(); i++) {
				const plr = players[i];
				this.saveMeta(plr.UserId);
				Logger.info(`Saving ${plr.UserId} to ${this.datastore.Name}`);
			}
		});
	}

	public getAllMeta(userId: number) {
		return (this.meta_cache[userId] ??= []);
	}

	public getMeta(userId: number, index: number) {
		return (this.getAllMeta(userId)[index] ??= {
			name: "Slot " + index,
			color: [255, 255, 255],
			blocks: 0,
		});
	}

	public getBlocks(userId: number, index: number) {
		return ((this.blocks_cache[userId] ??= {})[index] ??= this.loadBlocks(userId, index) ?? []);
	}

	public setBlocks(userId: number, index: number, blocks: readonly SerializedBlock[]) {
		return ((this.blocks_cache[userId] ??= {})[index] = blocks);
	}

	private loadBlocks(userId: number, index: number) {
		// todo: move
		if (math.abs(os.difftime(this.player_lastsave[userId], os.clock())) >= Players.GetPlayers().size() * 10) {
			return;
		}

		this.player_lastsave[userId] = os.clock();
		try {
			const [response, keyinfo] = this.datastore.GetAsync<string>(`${userId}_${index}`);
			return ((this.blocks_cache[userId] ??= {})[index] = HttpService.JSONDecode(
				response as string,
			) as SerializedBlock[]);
		} catch {
			return ((this.blocks_cache[userId] ??= {})[index] = []);
		}
	}

	private saveBlocks(userId: number, index: number) {
		this.datastore.SetAsync(
			`${userId}_${index}`,
			HttpService.JSONEncode((this.blocks_cache[userId] ??= {})[index]),
		);
		delete this.blocks_cache[userId];
	}

	private loadMeta(userId: number): void {
		try {
			const [response, keyinfo] = this.datastore.GetAsync<string>(tostring(userId));
			this.meta_cache[userId] = HttpService.JSONDecode(response as string) as (typeof this.meta_cache)[number];
		} catch {
			this.meta_cache[userId] = [];
		}
	}

	private saveMeta(userId: number): void {
		this.datastore.SetAsync(tostring(userId), HttpService.JSONEncode(this.meta_cache[userId]));
		delete this.meta_cache[userId];
	}
}
