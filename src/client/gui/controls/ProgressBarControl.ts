import { Control } from "client/gui/Control";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { NumberObservableValue } from "shared/event/NumberObservableValue";

export type ProgressBarControlDefinition = GuiObject & ProgressBarControlDefinitionParts;
export type ProgressBarControlDefinitionParts = {
	readonly Filled?: GuiObject;
	readonly Text?: TextLabel;
	readonly Knob?: GuiObject;
};

/** Control that represents a number as a progress bar. */
export class ProgressBarControl extends Control<ProgressBarControlDefinition> {
	readonly value;
	readonly vertical;

	private readonly parts: ProgressBarControlDefinitionParts;

	constructor(
		gui: ProgressBarControlDefinition,
		min: number,
		max: number,
		step: number,
		parts?: ProgressBarControlDefinitionParts,
	) {
		super(gui);

		this.parts = {
			Filled: parts?.Filled ?? Control.findFirstChild(gui, "Filled"),
			Knob: parts?.Knob ?? Control.findFirstChild(gui, "Knob"),
			Text: parts?.Text ?? Control.findFirstChild(gui, "Text"),
		};

		this.value = new NumberObservableValue(min, min, max, step);
		this.vertical = this.getAttribute<boolean>("Vertical") === true;

		this.subscribeVisual();
	}

	private subscribeVisual() {
		if (this.parts.Text) {
			const text = this.parts.Text;
			this.event.subscribeObservable(this.value, (value) => (text.Text = tostring(value)), true);
		}

		if (this.parts.Knob) {
			GuiAnimator.value(
				this.event,
				this.parts.Knob,
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

		if (this.parts.Filled) {
			GuiAnimator.value(
				this.event,
				this.parts.Filled,
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
