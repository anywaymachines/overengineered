import ObservableValue from "shared/event/ObservableValue";
import Control from "client/base/Control";

export type NumberTextBoxControlDefinition = TextBox;
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition) {
		super(gui);

		this.value = new ObservableValue(0);
		this.event.subscribeObservable(this.value, (value) => (this.gui.Text = tostring(value)), true);

		const update = () => {
			const text = this.gui.Text.gsub("%D", "")[0];

			let num = tonumber(text);
			if (num === undefined) {
				this.gui.Text = "0";
				num = 0;
			}

			this.gui.Text = tostring(num);
			this.value.set(num);
		};

		this.event.subscribe(this.gui.FocusLost, update);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, update);
	}
}
