import { Players, RunService } from "@rbxts/services";
import { Signal } from "shared/event/Signal";
import { GameDefinitions } from "./data/GameDefinitions";

export namespace Logger {
	const _onLog = new Signal<(text: string, error: boolean) => void>();
	export const onLog = _onLog.asReadonly();

	export function info(msg: string) {
		if (RunService.IsClient() === true) {
			// Show logs only to maintainers
			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				print(`[INFO] [CLIENT] ${msg}`);
			}
		} else {
			print(`[INFO] [SERVER] ${msg}`);
		}

		_onLog.Fire(msg, false);
	}

	export function warn(msg: string) {
		if (RunService.IsClient() === true) {
			// Show logs only to maintainers
			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				print(`[WARN] [CLIENT] ${msg}`);
			}
		} else {
			print(`[WARN] [SERVER] ${msg}`);
		}

		_onLog.Fire(msg, false);
	}

	export function err(msg: string) {
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

		_onLog.Fire(msg, true);
	}
}
