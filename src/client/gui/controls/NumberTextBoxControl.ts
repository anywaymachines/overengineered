import ObservableValue from "shared/event/ObservableValue";
import Control from "client/base/Control";

export type NumberTextBoxControlDefinition = TextBox;
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition) {
		super(gui);

		this.value = new ObservableValue(0);
		this.event.subscribe(this.gui.FocusLost, () => {
			const text = this.gui.Text.gsub("%D", "")[0];

			let num = tonumber(text);
			if (num === undefined) {
				this.gui.Text = "0";
				num = 0;
			}

			this.value.set(num);
		});
	}
}
