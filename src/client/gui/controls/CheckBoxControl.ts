import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";
import Animation from "../Animation";

export type CheckBoxControlDefinition = TextButton & {
	Circle: TextButton;
};

export default class CheckBoxControl extends Control<CheckBoxControlDefinition> {
	public readonly value = new ObservableValue(false);

	private readonly color = Color3.fromRGB(48, 62, 87);
	private readonly activeColor = Color3.fromRGB(13, 150, 255);

	constructor(gui: CheckBoxControlDefinition) {
		super(gui);

		this.event.subscribe(gui.MouseButton1Click, () => this.value.set(!this.value.get()));
		this.event.subscribe(gui.Circle.MouseButton1Click, () => this.value.set(!this.value.get()));

		Animation.value(
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
		Animation.value(
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
