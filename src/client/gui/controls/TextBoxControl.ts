import ObservableValue from "shared/event/ObservableValue";
import Control from "client/base/Control";
import Signal from "@rbxts/signal";

export type TextBoxControlDefinition = TextBox;

/** Control that represents a text value */
export default class TextBoxControl extends Control<TextBoxControlDefinition> {
	public readonly submitted = new Signal<(value: string) => void>();
	public readonly text;

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
