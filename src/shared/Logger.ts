import { RunService, Workspace } from "@rbxts/services";
import { $compileTime } from "rbxts-transformer-macros";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Objects } from "shared/fixes/objects";

// stuff like [CLIENT] and [Logger.ts:456] is already present in studio so we don't really need to print it
// BUT print() only writes as a "Logger.ts:123" instead of the actual source, so we don't disable this
const printAdditional = true || !RunService.IsStudio();
const context = !printAdditional ? "" : RunService.IsServer() ? " [SERV]" : " [CLIE]";

type LogLevel = {
	readonly name: string;
	readonly print: (...args: unknown[]) => void;
};

const levels = {
	info: {
		name: "INF",
		print,
	},
	warn: {
		name: "WRN",
		print: warn,
	},
	error: {
		name: "ERR",
		print: (...args) => {
			try {
				error(
					Objects.asMap(args)
						.map((i, v) => (v === undefined ? "nil" : tostring(v)))
						.join(", "),
					1,
				);
			} catch {
				// empty
			}
		},
	},
} satisfies Record<string, LogLevel>;

export namespace Logger {
	const scopeStack: string[] = [];

	function init() {
		if (!RunService.IsClient()) return;

		const compileTime = DateTime.fromUnixTimestamp($compileTime()).FormatUniversalTime(
			"DD MMM YYYY (HH:mm)",
			"en-us",
		);

		print(`🛠️ Plane Engineers 🛠️`);
		print();
		print(`ℹ️ Environment: ${GameDefinitions.isTestPlace() ? "⚠️ Testing" : "✅ Production"}`);
		print(`ℹ️ Version: ${GameDefinitions.VERSION}`);
		print(`ℹ️ Build: ${RunService.IsStudio() ? "🔒 Internal" : game.PlaceVersion} [ ${compileTime} ]`);
		print(`ℹ️ Server: ${RunService.IsStudio() ? "🔒 Local" : game.JobId}`);
		print(`ℹ️ Debris: ${Workspace.HasTag("PrivateServer") ? "🔓 Everlasting" : "🔒 Default"}`);
		print();
	}
	init();

	export function beginScope(scope: string) {
		scopeStack.push(scope);
	}
	export function endScope() {
		scopeStack.pop();
	}

	function stackToName() {
		if (scopeStack.size() === 0) return "";
		return `[${scopeStack.map((s) => `${s}`).join(" > ")}]`;
	}

	// TODO: delete this because when would it be false?
	function isActive() {
		return true;
	}
	export function log(level: LogLevel, ...args: unknown[]) {
		if (!isActive()) return;
		level.print(`[${level.name}]${context} ${stackToName()}`, ...args);
	}

	export function info(...args: unknown[]) {
		log(levels.info, ...args);
	}
	export function warn(...args: unknown[]) {
		log(levels.warn, ...args);
	}
	export function err(...args: unknown[]) {
		log(levels.error, ...args);
	}

	function addAdditional(additional: string, ...args: unknown[]) {
		if (printAdditional) {
			return [
				...(Objects.asArray(Objects.asMap(args).map((k, a) => (a === undefined ? "nil" : a))) as defined[]),
				additional,
			];
		}

		return args;
	}

	/** @deprecated For internal usage */
	export function _info(additional: string, ...args: unknown[]) {
		info(...addAdditional(additional, ...args));
	}
	/** @deprecated For internal usage */
	export function _warn(additional: string, ...args: unknown[]) {
		warn(...addAdditional(additional, ...args));
	}
	/** @deprecated For internal usage */
	export function _err(additional: string, ...args: unknown[]) {
		err(...addAdditional(additional, ...args));
	}
}
