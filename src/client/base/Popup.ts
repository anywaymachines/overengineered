import Signal from "@rbxts/signal";
import Scene from "./Scene";

export default class Popup<T extends GuiObject = GuiObject, TParams extends unknown[] = []> extends Scene<T, TParams> {
	public readonly onShow = new Signal<() => void>();
	public readonly onHide = new Signal<() => void>();

	public show(...args: TParams) {
		super.show(...args);
		this.onShow.Fire();
	}

	public hide() {
		super.hide();
		this.onHide.Fire();
	}
}
