import { Players } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class PlayerCache {
	public static playerData: { [userID: number]: { inputType?: InputType } } = {};

	public static initialize() {
		this.initEvents();
	}

	private static initEvents() {
		// Create empty data
		Players.PlayerAdded.Connect((player) => {
			this.playerData[player.UserId] = {};
		});

		// Input type listener
		Remotes.Server.GetNamespace("Player")
			.Get("InputTypeInfo")
			.Connect((player, inputType) => {
				Logger.info(`Recieved ${player.Name}'s input type - ${inputType}`);
				this.playerData[player.UserId]["inputType"] = inputType;
			});

		// Data remove
		Players.PlayerRemoving.Connect((player) => {
			delete this.playerData[player.UserId];
		});
	}
}
