import { DataStoreService, HttpService, Players } from "@rbxts/services";
import { PlayerConfigUpdater } from "server/PlayerConfigVersioning";
import { Db } from "./Database";

export type PlayerData = {
	readonly purchasedSlots?: number;
	readonly settings?: Partial<PlayerConfig>;
	readonly slots?: readonly SlotMeta[];
};

export class PlayerDatabase {
	static readonly instance = new PlayerDatabase();

	private readonly onlinePlayers = new Set<number>();
	private readonly datastore;
	private readonly db;

	constructor() {
		try {
			this.datastore = DataStoreService.GetDataStore("players");
		} catch {
			warn("Place datastore is not available. All requests will be dropped.");
		}

		this.db = new Db<PlayerData>(
			this.datastore,
			() => ({}),
			(data) => HttpService.JSONEncode(data),
			(data) => {
				const pdata = HttpService.JSONDecode(data) as PlayerData;
				return {
					...pdata,
					settings: pdata.settings === undefined ? undefined : PlayerConfigUpdater.update(pdata.settings),
				};
			},
		);

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			const key = tostring(plr.UserId);
			this.db.save(key);
		});
	}

	get(userId: number) {
		return this.db.get(tostring(userId));
	}

	set(userId: number, data: PlayerData) {
		this.db.set(tostring(userId), data);

		if (!this.onlinePlayers.has(userId)) {
			this.db.save(tostring(userId));
		}
	}
}
