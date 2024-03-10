import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import ObservableValue from "shared/event/ObservableValue";
import Signal from "shared/event/Signal";

export type ToggleControlDefinition = TextButton & {
	readonly Circle: TextButton;
};

/** Control that represents a boolean */
export default class ToggleControl extends Control<ToggleControlDefinition> {
	readonly submitted = new Signal<(value: boolean) => void>();
	readonly value = new ObservableValue(false);

	private readonly color = Colors.accentDark;
	private readonly activeColor = Colors.accent;

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
