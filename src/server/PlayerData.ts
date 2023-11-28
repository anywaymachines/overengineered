import { DataStoreService, HttpService, Players } from "@rbxts/services";
import BlocksSerializer, { SerializedBlock } from "./plots/BlocksSerializer";
import SharedPlots from "shared/building/SharedPlots";

export type PlayerData = {
	additionalSaveSlots?: number;
	slots: { name?: string; color?: SerializedColor; data?: SerializedBlock[] }[];
};

export default class PlayerDatabase {
	private static readonly playerDatastore = DataStoreService.GetDataStore("players");
	private static readonly loadedData: { [key: string]: PlayerData } = {};

	public static initialize() {
		// Load player data on join
		Players.PlayerAdded.Connect((plr) => {
			try {
				const [response, keyinfo] = this.playerDatastore.GetAsync<string>(tostring(plr.UserId));
				this.loadedData[tostring(plr.UserId)] = HttpService.JSONDecode(response as string) as PlayerData;
			} catch {
				this.loadedData[tostring(plr.UserId)] = { slots: [] };
			}
		});

		// Unload & save data on leave
		Players.PlayerRemoving.Connect((plr) => {
			this.playerDatastore.SetAsync(
				tostring(plr.UserId),
				HttpService.JSONEncode(this.loadedData[tostring(plr.UserId)]),
			);

			delete this.loadedData[tostring(plr.UserId)];
		});

		// Unload & save all players data on game closing
		game.BindToClose(() => {
			Players.GetPlayers().forEach((plr) => {
				this.playerDatastore.SetAsync(
					tostring(plr.UserId),
					HttpService.JSONEncode(this.loadedData[tostring(plr.UserId)]),
				);

				delete this.loadedData[tostring(plr.UserId)];
			});
		});
	}

	public static getSlot(player: Player, index: number) {
		return ((this.loadedData[tostring(player.UserId)] ??= { slots: [] }).slots[index] ??= {});
	}

	public static saveIntoSlot(player: Player, index: number) {
		this.loadedData[tostring(player.UserId)].slots[index] ??= {};

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const serializedBlocks = BlocksSerializer.serialize(plot);
		this.loadedData[tostring(player.UserId)].slots[index].data = serializedBlocks;
	}
}
