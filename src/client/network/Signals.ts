import Signal from "@rbxts/signal";
import InputController from "../controller/InputController";

export default class Signals {
	public static readonly PLATFORM_CHANGED_EVENT = new Signal<(platform: typeof InputController.inputType) => void>();
}
