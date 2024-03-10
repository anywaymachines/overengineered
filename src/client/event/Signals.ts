import { Workspace } from "@rbxts/services";
import Signal from "shared/event/Signal";

/** Class for working with local networking signals */
export default class Signals {
	static readonly CAMERA = {
		MOVED: (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
	} as const;

	static readonly PLAYER = {
		SPAWN: this.registerSignal(new Signal<() => void>()),
		DIED: this.registerSignal(new Signal<() => void>()),
	} as const;

	static readonly BLOCKS = {
		BLOCK_ADDED: this.registerSignal(new Signal<(block: Model) => void>()),
		BLOCK_REMOVED: this.registerSignal(new Signal<(block: Model) => void>()),
		BLOCKS_MOVED: this.registerSignal(new Signal<(offset: Vector3) => void>()),
	} as const;

	private static registerSignal<T extends Signal>(signal: T): T {
		return signal;
	}
}
