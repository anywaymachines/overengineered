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

	private static registerSignal<T extends Signal>(signal: T): T {
		return signal;
	}
}
