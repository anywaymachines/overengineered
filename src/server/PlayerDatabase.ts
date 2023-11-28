import { DataStoreService, Players, HttpService } from "@rbxts/services";
import Logger from "shared/Logger";

export type PlayerData = {
	purchasedSlots?: number;
};

export default class PlayerDatabase {
	public static readonly instance = new PlayerDatabase();

	private readonly datastore: DataStore = DataStoreService.GetDataStore("players");
	private readonly cache: { [key: string]: PlayerData } = {};

	constructor() {
		this.prepare();
	}

	protected prepare() {
		Players.PlayerAdded.Connect((plr) => this.load(tostring(plr.UserId)));
		Players.PlayerRemoving.Connect((plr) => this.save(tostring(plr.UserId)));

		game.BindToClose(() => {
			Logger.info("Game termination detected");
			const players = Players.GetPlayers();

			for (let i = 0; i < players.size(); i++) {
				const plr = players[i];
				Logger.info(`Saving ${plr.UserId} to ${this.datastore.Name}`);
				this.datastore.SetAsync(tostring(plr.UserId), HttpService.JSONEncode(this.cache[tostring(plr.UserId)]));
			}
		});
	}

	public get(key: string) {
		return (this.cache[key] ??= {});
	}

	public save(key: string) {
		this.datastore.SetAsync(key, HttpService.JSONEncode(this.cache[key]));
		delete this.cache[key];
	}

	private load(key: string) {
		try {
			const [response, keyinfo] = this.datastore.GetAsync<string>(key);
			return (this.cache[key] = HttpService.JSONDecode(response as string) as PlayerData);
		} catch {
			// Empty
		}
	}
}
