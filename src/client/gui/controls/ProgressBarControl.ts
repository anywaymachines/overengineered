import Control from "client/base/Control";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import Animation from "../Animation";

export type ProgressBarControlDefinition = GuiObject & {
	Filled?: GuiObject;
	Text?: TextLabel;
	FormattedText?: TextLabel;
	Knob?: GuiObject;
};

/** Control that represents a number as a progress bar. */
export default class ProgressBarControl<
	T extends ProgressBarControlDefinition = ProgressBarControlDefinition,
> extends Control<T> {
	public readonly textValue;
	public readonly value;
	public readonly vertical;

	constructor(gui: T, min: number, max: number, step: number) {
		super(gui);
		this.textValue = new ObservableValue<string | number | undefined>(undefined);
		this.value = new NumberObservableValue(min, min, max, step);
		this.vertical = this.getAttribute<boolean>("Vertical") === true;

		this.subscribeVisual();
	}

	public getTextValue() {
		return this.textValue;
	}

	private subscribeVisual() {
		if (Control.exists(this.gui, "FormattedText")) {
			const label = this.gui.FormattedText;
			const template = label.Text ?? "{}";

			this.event.subscribeObservable(
				this.textValue,
				(value) => {
					if (value === undefined) return;
					label.Text = template.format(value);
				},
				true,
			);
		}

		if (Control.exists(this.gui, "Text")) {
			const text = this.gui.Text;
			this.event.subscribeObservable(this.textValue, (value) => (text.Text = tostring(value)), true);
		}

		if (Control.exists(this.gui, "Knob")) {
			Animation.value(
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
			Animation.value(
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
