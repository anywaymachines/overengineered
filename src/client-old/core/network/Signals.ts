import Signal from "@rbxts/signal";
import AbstractToolMeta from "../abstract/AbstractToolMeta";
import { Workspace } from "@rbxts/services";
import InputController from "../InputController";

export default class Signals {
	public static TOOL = {
		EQUIPPED: new Signal<(tool: AbstractToolMeta) => void>(),
		UNEQUIPPED: new Signal<(tool: AbstractToolMeta) => void>(),
	};

	public static CAMERA_MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");

	public static PLATFORM_CHANGED = new Signal<(platform: typeof InputController.currentPlatform) => void>();

	public static RIDE_REQUEST = new Signal<() => void>();
}
