import { Players, RunService } from "@rbxts/services";
import GameDefinitions from "./GameDefinitions";
import Remotes from "./Remotes";

export default class Logger {
	static info(msg: string) {
		if (RunService.IsClient() === true) {
			// Show logs only to maintainers
			if (!GameDefinitions.DEVELOPERS.includes(Players.LocalPlayer.UserId)) {
				return;
			}

			print(`[INFO] [CLIENT] ${msg}`);
		} else {
			print(`[INFO] [SERVER] ${msg}`);
		}

		if (RunService.IsStudio()) {
			Remotes.Server.GetNamespace("Debug")
				.Get("DisplayLine")
				.SendToAllPlayers("■ (DEBUG) " + msg, RunService.IsClient());
		}
	}
}
