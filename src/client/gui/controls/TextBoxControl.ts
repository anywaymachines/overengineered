import { Control } from "client/gui/Control";
import { Signal } from "shared/event/Signal";

export type TextBoxControlDefinition = TextBox;

/** Control that represents a text value */
export class TextBoxControl extends Control<TextBoxControlDefinition> {
	readonly submitted = new Signal<(value: string) => void>();
	readonly text;

	constructor(gui: TextBoxControlDefinition) {
		super(gui);
		this.text = this.event.observableFromInstanceParam(gui, "Text");

		const activated = () => this.submitted.Fire(this.text.get());
		this.event.subscribe(this.gui.FocusLost, activated);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, activated);
	}
}
