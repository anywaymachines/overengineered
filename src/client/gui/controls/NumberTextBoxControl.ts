import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import NumberObservableValue from "shared/event/NumberObservableValue";

export type NumberTextBoxControlDefinition = TextBox;

/** Control that represents a number via a text input */
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly submitted = new Signal<(value: number) => void>();
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition, min: number, max: number, step: number) {
		super(gui);

		this.value = new NumberObservableValue(0, min, max, step);
		this.event.subscribeObservable(this.value, (value) => (this.gui.Text = tostring(value)), true);

		this.event.subscribe(this.gui.FocusLost, () => this.commit());
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, () => this.commit());
	}

	private commit() {
		const text = this.gui.Text.gsub("[^-0123456789]", "")[0];

		let num = tonumber(text);
		if (num === undefined) {
			this.gui.Text = "0";
			num = 0;
		}
		if (num === this.value.get()) return;

		this.gui.Text = tostring(num);
		this.value.set(num);
		this.submitted.Fire(num);
	}

	public destroy() {
		this.commit();
		super.destroy();
	}
}
