import { Players, RunService } from "@rbxts/services";
import { Signal } from "shared/event/Signal";
import { GameDefinitions } from "./data/GameDefinitions";

const isActive = () => {
	return (
		!RunService.IsClient() ||
		GameDefinitions.isTestPlace() ||
		(RunService.IsClient() && GameDefinitions.isAdmin(Players.LocalPlayer))
	);
};

export class Logger {
	private static readonly _onLog = new Signal<(text: string, error: boolean) => void>();
	static readonly onLog = this._onLog.asReadonly();

	constructor(private readonly name: string) {}

	info(...params: unknown[]) {
		if (!isActive()) return;

		Logger._onLog.Fire(params.filterUndefined().join(" "), false);

		if (RunService.IsClient()) {
			return print(`[INFO] [CLIENT] [${this.name}]`, ...params);
		}

		return print(`[INFO] [SERVER] [${this.name}]`, ...params);
	}

	warn(...params: unknown[]) {
		if (!isActive()) return;

		Logger._onLog.Fire(params.filterUndefined().join(" "), false);

		if (RunService.IsClient()) {
			return warn(`[WARN] [CLIENT] [${this.name}]`, ...params);
		}

		return warn(`[WARN] [SERVER] [${this.name}]`, ...params);
	}

	error(message: string, alwaysVisible: boolean = true) {
		if (!isActive() && !alwaysVisible) return;

		Logger._onLog.Fire(message, true);

		try {
			if (RunService.IsClient()) {
				return error(`[ERROR] [CLIENT] [${this.name}] ${message}`);
			}

			return error(`[ERROR] [SERVER] [${this.name}] ${message}`);
		} catch {
			// empty
		}
	}
}
