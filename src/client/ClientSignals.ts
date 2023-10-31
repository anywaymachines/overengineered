import Signal from "@rbxts/signal";
import AbstractToolMeta from "./gui/abstract/AbstractToolMeta";
import { Workspace } from "@rbxts/services";

export default class ClientSignals {
	public static TOOL_EQUIPED = new Signal<(tool: AbstractToolMeta) => void>();
	public static TOOL_UNEQUIPED = new Signal<(tool: AbstractToolMeta) => void>();

	public static CAMERA_MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");
}
