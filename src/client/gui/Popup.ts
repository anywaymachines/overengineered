import { Lighting, TweenService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { Element } from "shared/Element";
import { Colors } from "./Colors";
import Control from "./Control";
import Gui from "./Gui";
import { ScaledScreenGui } from "./GuiScale";

export default class Popup<T extends GuiObject = GuiObject> extends Control<T> {
	static readonly onAnyShow = new Signal<() => void>();
	static readonly onAnyHide = new Signal<() => void>();
	static readonly onAllHide = new Signal<() => void>();
	private static readonly popupsScreenGui = Gui.getPopupUI();
	private static readonly blur = Lighting.WaitForChild("Blur") as BlurEffect;

	static {
		Popup.onAnyShow.Connect(() => Popup.tweenBlur(12));
		Popup.onAllHide.Connect(() => Popup.tweenBlur(0));
	}
	constructor(gui: T) {
		super(gui);
	}

	private static tweenBlur(size: number) {
		TweenService.Create(Popup.blur, new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			Size: size,
		}).Play();
	}

	show() {
		super.show();
		Popup.onAnyShow.Fire();

		new ScaledScreenGui(
			Element.create(
				"ScreenGui",
				{ Name: tostring(this), Parent: Popup.popupsScreenGui, IgnoreGuiInset: true },
				{
					bg: Element.create("Frame", {
						Size: new UDim2(1, 0, 1, 0),
						BackgroundColor3: Colors.black,
						BackgroundTransparency: 0.5,
					}),
					popup: this.instance,
				},
			),
		).enable();
	}
	hide() {
		super.hide();
		Popup.onAnyHide.Fire();
		this.instance.Parent?.Destroy();

		// 1 for UIScale
		if (Popup.popupsScreenGui.GetChildren().size() === 1) {
			Popup.onAllHide.Fire();
		}
	}
}
