import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";

export type DropdownDefinition = GuiObject & {
	readonly Button: GuiButton;
	readonly Content: GuiObject;
};
export class Dropdown<T extends DropdownDefinition = DropdownDefinition> extends Control<T> {
	private readonly button;
	private readonly contents;

	constructor(gui: T) {
		super(gui);

		this.button = this.add(new ButtonControl(this.gui.Button));
		this.contents = this.add(new Control(this.gui.Content));

		this.event.subscribe(this.button.activated, () => {
			this.contents.isVisible() ? this.contents.hide() : this.contents.show();
		});
	}
}
