import Bindable from "shared/event/ObservableValue";
import Control from "client/base/Control";

export type NumberTextBoxControlDefinition = TextBox;
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition) {
		super(gui);

		this.value = new Bindable(0);
		this.eventHandler.subscribe(this.gui.FocusLost, () => {
			print("pressed " + this.gui.Text);
			const text = this.gui.Text.gsub("%D", "")[0];
			print("next " + text);

			let num = tonumber(text);
			if (num === undefined) {
				this.gui.Text = "0";
				num = 0;
			}

			this.value.set(num);
		});
	}
}
