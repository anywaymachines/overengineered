import ObservableValue from "shared/event/ObservableValue";
import Control from "client/base/Control";

export type TextBoxControlDefinition = TextBox;

/** Control that represents a text value */
export default class TextBoxControl extends Control<TextBoxControlDefinition> {
	public readonly text;

	constructor(gui: TextBoxControlDefinition) {
		super(gui);

		this.text = new ObservableValue("");
		this.event.subscribeObservable(this.text, (value) => (this.gui.Text = tostring(value)), true);

		const update = () => this.text.set(this.gui.Text);
		this.event.subscribe(this.gui.FocusLost, update);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, update);
	}
}
