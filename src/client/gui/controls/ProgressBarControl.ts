import Control from "client/gui/Control";
import NumberObservableValue from "shared/event/NumberObservableValue";
import GuiAnimator from "../GuiAnimator";

export type ProgressBarControlDefinition = GuiObject & {
	Filled?: GuiObject;
	Text?: TextLabel;
	Knob?: GuiObject;
};

/** Control that represents a number as a progress bar. */
export default class ProgressBarControl<
	T extends ProgressBarControlDefinition = ProgressBarControlDefinition,
> extends Control<T> {
	public readonly value;
	public readonly vertical;

	constructor(gui: T, min: number, max: number, step: number) {
		super(gui);
		this.value = new NumberObservableValue(min, min, max, step);
		this.vertical = this.getAttribute<boolean>("Vertical") === true;

		this.subscribeVisual();
	}

	private subscribeVisual() {
		if (Control.exists(this.gui, "Text")) {
			const text = this.gui.Text;
			this.event.subscribeObservable(this.value, (value) => (text.Text = tostring(value)), true);
		}

		if (Control.exists(this.gui, "Knob")) {
			GuiAnimator.value(
				this.event,
				this.gui.Knob as GuiObject,
				this.value,
				(value) => {
					const pos = (value - this.value.min) / this.value.getRange();
					return {
						Position: new UDim2(this.vertical ? 0.5 : pos, 0, this.vertical ? pos : 0.5, 0),
					};
				},
				new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			);
		}

		if (Control.exists(this.gui, "Filled")) {
			GuiAnimator.value(
				this.event,
				this.gui.Filled as GuiObject,
				this.value,
				(value) => {
					const pos = (value - this.value.min) / this.value.getRange();
					return {
						Size: new UDim2(this.vertical ? 1 : pos, 0, this.vertical ? pos : 1, 0),
					};
				},
				new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			);
		}
	}
}
