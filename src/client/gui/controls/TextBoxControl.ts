import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";

export type TextBoxControlDefinition = TextBox;
export default class TextBoxControl<T extends TextBoxControlDefinition = TextBoxControlDefinition> extends Control<T> {
	public readonly value;

	constructor(gui: T) {
		super(gui);

		this.value = new ObservableValue(this.gui.Text ?? "");
		this.eventHandler.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, () => this.value.set(this.gui.Text));
	}
}
