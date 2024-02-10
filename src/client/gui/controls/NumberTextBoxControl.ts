import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";

export type NumberTextBoxControlDefinition = TextBox;

/** Control that represents a number via a text input */
export default class NumberTextBoxControl<
	T extends number | undefined = number,
> extends Control<NumberTextBoxControlDefinition> {
	public readonly submitted = new Signal<(value: number) => void>();
	public readonly value;

	constructor(gui: NumberTextBoxControlDefinition);
	constructor(gui: NumberTextBoxControlDefinition, min: number, max: number, step: number);
	constructor(gui: NumberTextBoxControlDefinition, min?: number, max?: number, step?: number) {
		super(gui);

		if (min !== undefined && max !== undefined && step !== undefined) {
			this.value = new NumberObservableValue<T>(0 as T, min, max, step);
		} else {
			this.value = new ObservableValue<T>(0 as T);
		}

		this.event.subscribeObservable(
			this.value,
			(value) => {
				let text = tostring(value ?? "");
				if (step !== undefined && max !== undefined) {
					text = text.sub(1, tostring(step + max).size());
				}

				this.gui.Text = text;
			},
			true,
		);

		this.event.subscribe(this.gui.FocusLost, () => this.commit(true));
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, () => this.commit(false));
	}

	private commit(byLostFocus: boolean) {
		const text = this.gui.Text.gsub("[^-0123456789.]", "")[0];

		let num = tonumber(text);
		if (num === undefined) {
			if (byLostFocus) {
				this.gui.Text = tostring(this.value.get() ?? "");
				return;
			}

			this.gui.Text = "0";
			num = 0;
		}
		if (num === this.value.get()) return;

		this.gui.Text = tostring(num);
		this.value.set(num as T);
		this.submitted.Fire(num);
	}

	public destroy() {
		this.commit(true);
		super.destroy();
	}
}
