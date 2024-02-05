import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";

export type LabelControlDefinition = TextLabel;

/** Control that shows a text value */
export default class LabelControl extends Control<LabelControlDefinition> {
	readonly value;

	constructor(gui: LabelControlDefinition, autoSize?: number) {
		super(gui);

		this.value = new ObservableValue("");
		this.event.subscribeObservable(this.value, (value) => (this.gui.Text = tostring(value)), true);

		if (autoSize !== undefined) {
			this.event.subscribeObservable(
				this.event.readonlyObservableFromInstanceParam(this.gui, "AbsoluteSize"),
				() => {
					this.gui.TextScaled = false;
					this.gui.TextSize = autoSize;
				},
				true,
			);
		}
	}
}
