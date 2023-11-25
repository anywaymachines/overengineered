import Signal from "@rbxts/signal";
import Scene from "./Scene";

export default class Popup<T extends GuiObject | Instance = Instance, TParams extends unknown[] = []> extends Scene<
	T,
	TParams
> {
	public static readonly onAnyShow = new Signal<() => void>();
	public static readonly onAnyHide = new Signal<() => void>();

	public readonly onShow = new Signal<() => void>();
	public readonly onHide = new Signal<() => void>();

	public show(...args: TParams) {
		super.show(...args);
		this.onShow.Fire();
		Popup.onAnyShow.Fire();
	}

	public hide() {
		super.hide();
		this.onHide.Fire();
		Popup.onAnyHide.Fire();
	}
}
