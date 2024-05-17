import { RunService } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";

declare global {
	function $log(...args: unknown[]): void;
	function $err(...args: unknown[]): void;
	function $warn(...args: unknown[]): void;
}

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
				warn(
					asMap(args)
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

		print(`🛠️ Plane Engineers 🛠️`);
		print();
		for (const env of GameDefinitions.getEnvironmentInfo()) {
			print(`ℹ ${env}`);
		}
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
			return [...(asArray(asMap(args).map((k, a) => (a === undefined ? "nil" : a))) as defined[]), additional];
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
