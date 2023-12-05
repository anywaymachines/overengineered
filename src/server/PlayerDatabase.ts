import { DataStoreService, HttpService, Players } from "@rbxts/services";
import Logger from "shared/Logger";
import { Db } from "./Database";

export type PlayerData = {
	readonly purchasedSlots?: number;
	readonly settings?: PlayerConfig;
};

export default class PlayerDatabase {
	public static readonly instance = new PlayerDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("players");
	private readonly db;

	constructor() {
		this.db = new Db<PlayerData>(
			this.datastore,
			() => ({}),
			(data) => HttpService.JSONEncode(data),
			(data) => HttpService.JSONDecode(data) as PlayerData,
		);
		this.prepare();
	}

	private prepare() {
		Players.PlayerRemoving.Connect((plr) => {
			const key = tostring(plr.UserId);
			this.db.save(key);
		});

		game.BindToClose(() => {
			Logger.info("Game termination detected");

			this.db.saveChanged();
			this.db.freeAll();
		});
	}

	public get(userId: string) {
		return this.db.get(userId);
	}

	public set(userId: string, data: PlayerData) {
		this.db.set(userId, data);
	}
}
