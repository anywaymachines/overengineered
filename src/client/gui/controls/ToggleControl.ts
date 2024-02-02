import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../GuiAnimator";

export type ToggleControlDefinition = TextButton & {
	readonly Circle: TextButton;
};

/** Control that represents a boolean */
export default class ToggleControl extends Control<ToggleControlDefinition> {
	public readonly submitted = new Signal<(value: boolean) => void>();
	public readonly value = new ObservableValue(false);

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);

	constructor(gui: ToggleControlDefinition) {
		super(gui);

		const clicked = () => {
			this.value.set(!this.value.get());
			this.submitted.Fire(this.value.get());
		};

		this.event.subscribe(gui.MouseButton1Click, clicked);
		this.event.subscribe(gui.Circle.MouseButton1Click, clicked);

		GuiAnimator.value(
			this.event,
			this.gui.Circle,
			this.value,
			(value) => {
				return {
					Position: new UDim2(value ? 0.5 : 0, 0, 0, 0),
				};
			},
			new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);
		GuiAnimator.value(
			this.event,
			this.gui,
			this.value,
			(value) => {
				return {
					BackgroundColor3: value ? this.activeColor : this.color,
				};
			},
			new TweenInfo(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);
	}
}
