import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";

export type LabelControlDefinition = TextLabel;

/** Control that shows a text value */
export default class FormattedLabelControl extends Control<LabelControlDefinition> {
	readonly value;

	constructor(gui: LabelControlDefinition) {
		super(gui);

		this.value = new ObservableValue<string | number | undefined>(undefined);

		const template = this.gui.Text ?? "{}";
		this.event.subscribeObservable(
			this.value,
			(value) => {
				if (value === undefined) return;
				this.gui.Text = template.format(value);
			},
			true,
		);
	}
}
