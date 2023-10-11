import { RunService } from "@rbxts/services";

export default class Logger {
	static info(msg: String) {
		if (RunService.IsClient() === true) {
			// Slient mode if non-studio server run
			if (RunService.IsStudio() !== true) {
				return;
			}

			print(`[INFO] [CLIENT] ${msg}`);
		} else {
			print(`[INFO] [SERVER] ${msg}`);
		}
	}
}
