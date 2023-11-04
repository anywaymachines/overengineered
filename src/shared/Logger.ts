import { Players, RunService } from "@rbxts/services";
import GameDefinitions from "./GameDefinitions";

export default class Logger {
	static info(msg: String) {
		if (RunService.IsClient() === true) {
			// Show logs only to maintainers
			if (!GameDefinitions.DEVELOPERS.includes(Players.LocalPlayer.UserId) && !GameDefinitions.IS_TESTING) {
				return;
			}

			print(`[INFO] [CLIENT] ${msg}`);
		} else {
			print(`[INFO] [SERVER] ${msg}`);
		}
	}
}
