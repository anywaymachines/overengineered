import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";

export type NumberTextBoxControlDefinition = TextBox;

/** Control that represents a number via a text input */
export default class NumberTextBoxControl extends Control<NumberTextBoxControlDefinition> {
	public readonly submitted = new Signal<(value: number) => void>();
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition);
	constructor(gui: NumberTextBoxControlDefinition, min: number, max: number, step: number);
	constructor(gui: NumberTextBoxControlDefinition, min?: number, max?: number, step?: number) {
		super(gui);

		if (min !== undefined && max !== undefined && step !== undefined) {
			this.value = new NumberObservableValue(0, min, max, step);
		} else {
			this.value = new ObservableValue(0);
		}

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
