import Control from "client/gui/Control";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import { TransformDirection } from "client/gui/Transform";

export default class Dropdown extends Control<GuiObject> {
	readonly button;
	readonly contents;

	constructor(gui: GuiObject, button: ButtonDefinition, contents: GuiObject, direction: TransformDirection) {
		super(gui);

		this.button = this.add(new ButtonControl(button));
		this.contents = this.add(new Control(contents));

		this.event.subscribe(this.button.activated, () => {
			this.contents.isVisible() ? this.contents.hide() : this.contents.show();
		});
	}
}
