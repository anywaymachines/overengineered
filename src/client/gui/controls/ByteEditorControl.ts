import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { Colors } from "shared/Colors";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";

export type ByteEditorDefinition = GuiObject & {
	readonly Buttons: Frame & {
		readonly b1: TextButton;
		readonly b2: TextButton;
		readonly b4: TextButton;
		readonly b8: TextButton;
		readonly b16: TextButton;
		readonly b32: TextButton;
		readonly b64: TextButton;
		readonly b128: TextButton;
	};
	readonly TextBox: TextBox;
};

export class ByteEditor extends Control<ByteEditorDefinition> {
	readonly submitted = new Signal<(value: number) => void>();
	readonly value = new ObservableValue<number>(0);

	private readonly buttons;

	constructor(gui: ByteEditorDefinition) {
		super(gui);

		this.buttons = (gui.Buttons.GetChildren().filter((value) => value.IsA("TextButton")) as TextButton[]).sort(
			(a, b) => a.LayoutOrder > b.LayoutOrder,
		);
		for (const button of this.buttons) {
			this.add(new ButtonControl(button));
		}

		// Value update
		this.value.subscribe((value, prev) => {
			this.gui.TextBox.Text = `${value}`;
			this.updateButtons();
		}, true);

		const tb = this.add(new NumberTextBoxControl(gui.TextBox, 0, 255, 1));
		tb.value.set(this.value.get());
		this.event.subscribeObservable(this.value, (value) => tb.value.set(value), true);
		this.event.subscribe(tb.submitted, (value) => this.value.set(value));

		// Button click
		for (const button of this.buttons) {
			this.event.subscribe(button.MouseButton1Click, () => {
				button.BackgroundColor3 =
					button.BackgroundColor3 === Colors.accent ? Colors.staticBackground : Colors.accent;

				const bits: boolean[] = [];
				for (let i = 0; i < 8; i++) {
					bits.push(this.buttons[i].BackgroundColor3 === Colors.accent);
				}
				this.value.set(this.bitsToByte(bits));

				this.submitted.Fire(this.value.get());
			});
		}
	}

	private updateButtons() {
		const bits = this.byteToBits(this.value.get());

		for (let i = 0; i < 8; i++) {
			this.buttons[i].BackgroundColor3 = bits[i] ? Colors.accent : Colors.staticBackground;
		}
	}

	private bitsToByte(boolArray: readonly boolean[]): number {
		let byteValue = 0;
		for (let i = 0; i < 8; i++) {
			if (boolArray[i]) {
				byteValue |= 1 << (7 - i);
			}
		}

		return byteValue;
	}

	private byteToBits(byteValue: number): boolean[] {
		const boolArray: boolean[] = [];
		for (let i = 0; i < 8; i++) {
			// Check if the i-th bit is set (1)
			boolArray.push((byteValue & (1 << (7 - i))) !== 0);
		}

		return boolArray;
	}
}
