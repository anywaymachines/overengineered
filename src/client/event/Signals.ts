import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import { Workspace } from "@rbxts/services";

/** Class for working with local networking signals */
export default class Signals {
	public static readonly CAMERA = {
		MOVED: (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
	} as const;

	public static readonly INPUT_TYPE_CHANGED_EVENT = new Signal<(platform: InputType) => void>();

	public static readonly PLAYER = {
		SPAWN: new Signal<() => void>(),
		DIED: new Signal<() => void>(),
	} as const;

	public static readonly TOOL = {
		EQUIPPED: new Signal<(tool: ToolBase) => void>(),
		UNEQUIPPED: new Signal<(tool: ToolBase) => void>(),
	} as const;

	public static readonly BLOCKS = {
		ADDED: new Signal<(block: Model) => void>(),
		REMOVED: new Signal<(block: Model) => void>(),
	} as const;

	public static readonly CONTRAPTION = {
		CLEARED: new Signal<() => void>(),
		MOVED: new Signal<(offset: Vector3) => void>(),
	} as const;
}
