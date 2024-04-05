import { Workspace } from "@rbxts/services";
import { Signal } from "shared/event/Signal";

/** Class for working with local networking signals */
export namespace Signals {
	export namespace CAMERA {
		export const MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");
	}

	export namespace PLAYER {
		export const SPAWN = registerSignal(new Signal<() => void>());
		export const DIED = registerSignal(new Signal<() => void>());
	}

	export const LOCAL_PLAY_MODE_CHANGED = new Signal<(mode: PlayModes) => void>();

	function registerSignal<T extends Signal>(signal: T): T {
		return signal;
	}
}
