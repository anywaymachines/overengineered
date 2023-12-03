import Control from "./Control";
import Signal from "@rbxts/signal";

export default class Popup<T extends GuiObject = GuiObject> extends Control<T> {
	public static readonly onAnyShow = new Signal<() => void>();
	public static readonly onAnyHide = new Signal<() => void>();

	public show() {
		super.show();
		Popup.onAnyShow.Fire();
	}

	public hide() {
		super.hide();
		Popup.onAnyHide.Fire();
	}
}
