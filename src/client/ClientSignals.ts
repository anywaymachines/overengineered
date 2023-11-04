import Signal from "@rbxts/signal";
import AbstractToolMeta from "./gui/abstract/AbstractToolMeta";
import { Workspace } from "@rbxts/services";
import GameInput from "./GameControls";

export default class ClientSignals {
	public static TOOL_EQUIPED = new Signal<(tool: AbstractToolMeta) => void>();
	public static TOOL_UNEQUIPED = new Signal<(tool: AbstractToolMeta) => void>();

	public static CAMERA_MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");

	public static PLATFORM_CHANGED = new Signal<(platform: typeof GameInput.currentPlatform) => void>();

	public static RIDE_REQUEST = new Signal<() => void>();
}
