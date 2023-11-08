import Signal from "@rbxts/signal";
import { Workspace } from "@rbxts/services";
import InputController from "../controller/InputController";

export default class Signals {
	public static CAMERA_MOVED_EVENT = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");
	public static PLATFORM_CHANGED_EVENT = new Signal<(platform: typeof InputController.controlType) => void>();
}
