import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import GameDefinitions from "./data/GameDefinitions";

export default class Logger {
	public static readonly onLog = new Signal<(text: string, error: boolean) => void>();

	static info(msg: string) {
		if (RunService.IsClient() === true) {
			// Show logs only to maintainers
			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				print(`[INFO] [CLIENT] ${msg}`);
			}
		} else {
			print(`[INFO] [SERVER] ${msg}`);
		}

		this.onLog.Fire(msg, false);
	}

	static error(msg: string) {
		if (RunService.IsClient() === true) {
			try {
				error(`[ERROR] [CLIENT] ${msg}`);
			} catch {
				// empty
			}
		} else {
			try {
				error(`[ERROR] [SERVER] ${msg}`);
			} catch {
				// empty
			}
		}

		this.onLog.Fire(msg, true);
	}
}
