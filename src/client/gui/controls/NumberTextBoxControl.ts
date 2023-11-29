import ObservableValue from "shared/event/ObservableValue";
import Control from "client/base/Control";
import Signal from "@rbxts/signal";

export type NumberTextBoxControlDefinition = TextBox;

/** Control that represents a number via a text input */
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly submitted = new Signal<(value: number) => void>();
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition) {
		super(gui);

		this.value = new ObservableValue(0);
		this.event.subscribeObservable(this.value, (value) => (this.gui.Text = tostring(value)), true);

		const activated = () => {
			const text = this.gui.Text.gsub("%D", "")[0];

			let num = tonumber(text);
			if (num === undefined) {
				this.gui.Text = "0";
				num = 0;
			}

			this.gui.Text = tostring(num);
			this.value.set(num);
			this.submitted.Fire(num);
		};

		this.event.subscribe(this.gui.FocusLost, activated);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, activated);
	}
}
