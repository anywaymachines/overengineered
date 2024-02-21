import Control from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";

export type DropdownDefinition = GuiButton & {
	readonly Content: GuiObject;
};
export default class Dropdown<T extends DropdownDefinition = DropdownDefinition> extends Control<T> {
	private readonly button;
	private readonly contents;

	constructor(gui: T, direction: "up" | "down" | "left" | "right") {
		super(gui);

		this.button = this.add(new ButtonControl(this.gui));
		this.contents = this.add(new Control(this.gui.Content));

		this.event.subscribe(this.button.activated, () => {
			this.contents.isVisible() ? this.contents.hide() : this.contents.show();
		});
	}
}
