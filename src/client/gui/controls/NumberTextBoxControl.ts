import { Control } from "client/gui/Control";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";

type ToNum<TAllowNull extends boolean> = TAllowNull extends false ? number : number | undefined;
export type NumberTextBoxControlDefinition = TextBox;
/** Control that represents a number via a text input */
export class NumberTextBoxControl<TAllowNull extends boolean = false> extends Control<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(value: number) => void>();
	readonly value;

	constructor(gui: NumberTextBoxControlDefinition);
	constructor(gui: NumberTextBoxControlDefinition, min: number, max: number, step: number);
	constructor(gui: NumberTextBoxControlDefinition, min?: number, max?: number, step?: number) {
		super(gui);

		if (min !== undefined && max !== undefined && step !== undefined) {
			this.value = new NumberObservableValue<ToNum<TAllowNull>>(0, min, max, step);
		} else {
			this.value = new ObservableValue<ToNum<TAllowNull>>(0);
		}

		this.event.subscribeObservable(
			this.value,
			(value) => {
				if (value === undefined) {
					this.gui.Text = "";
					return;
				}

				let text = tostring(value ?? "");
				if (step !== undefined) {
					text = string.format(`%.${math.max(0, math.ceil(-math.log(step, 10)))}f`, value ?? 0);
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

		this.value.set(num);
		this.submitted.Fire(this.value.get()!);
		this.gui.Text = tostring(this.value.get());
	}

	destroy() {
		this.commit(true);
		super.destroy();
	}
}
