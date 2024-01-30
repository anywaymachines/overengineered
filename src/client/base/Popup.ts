import { Lighting, TweenService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "./Control";

export default class Popup<T extends GuiObject = GuiObject> extends Control<T> {
	public static blur = Lighting.WaitForChild("Blur") as BlurEffect;
	public static readonly onAnyShow = new Signal<() => void>();
	public static readonly onAnyHide = new Signal<() => void>();

	private static tweenBlur(size: number) {
		TweenService.Create(Popup.blur, new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			Size: size,
		}).Play();
	}

	public show() {
		super.show();
		Popup.onAnyShow.Fire();

		Popup.tweenBlur(12);
	}

	public hide() {
		super.hide();
		Popup.onAnyHide.Fire();

		Popup.tweenBlur(0);
	}
}
