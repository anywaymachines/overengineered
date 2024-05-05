import { Control } from "client/gui/Control";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { Signal } from "shared/event/Signal";

export type ByteTextBoxControlDefinition = TextBox;
/** Control that represents a byte via a text input */
export class ByteTextBoxControl extends Control<ByteTextBoxControlDefinition> {
	readonly submitted = new Signal<(value: number) => void>();
	readonly value = new NumberObservableValue<number>(0, 0, 255, 1);

	constructor(gui: ByteTextBoxControlDefinition) {
		super(gui);

		this.event.subscribeObservable(
			this.value,
			(value) => {
				let text = tostring(value ?? "");
				text = string.format("%02X", value);

				this.gui.Text = text;
			},
			true,
		);

		this.event.subscribe(this.gui.FocusLost, () => this.commit(true));
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, () => this.commit(false));
	}

	private commit(byLostFocus: boolean) {
		const text = this.gui.Text.gsub("[^%dA-Fa-f]", "")[0];

		let num = tonumber(text, 16);
		if (num === undefined) {
			if (byLostFocus) {
				this.gui.Text = string.format("%02X", this.value.get() ?? 0);
				return;
			}

			this.gui.Text = "00";
			num = 0;
		}
		if (num === this.value.get()) return;

		this.gui.Text = tostring(num);
		this.value.set(num);
		this.submitted.Fire(num);
	}

	destroy() {
		this.commit(true);
		super.destroy();
	}
}
