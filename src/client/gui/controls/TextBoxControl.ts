import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";
import Signal from "shared/event/Signal";

export type TextBoxControlDefinition = TextBox;

/** Control that represents a text value */
export default class TextBoxControl extends Control<TextBoxControlDefinition> {
	readonly submitted = new Signal<(value: string) => void>();
	readonly text;

	constructor(gui: TextBoxControlDefinition) {
		super(gui);

		this.text = new ObservableValue("");
		this.event.subscribeObservable(this.text, (value) => (this.gui.Text = tostring(value)), true);

		const activated = () => {
			this.text.set(this.gui.Text);
			this.submitted.Fire(this.text.get());
		};
		this.event.subscribe(this.gui.FocusLost, activated);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, activated);
	}
}
