import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";

export type LabelControlDefinition = TextLabel;

/** Control that shows a text value */
export default class LabelControl extends Control<LabelControlDefinition> {
	readonly value;

	constructor(gui: LabelControlDefinition) {
		super(gui);

		this.value = new ObservableValue("");
		this.event.subscribeObservable(this.value, (value) => (this.gui.Text = tostring(value)), true);
	}
}
