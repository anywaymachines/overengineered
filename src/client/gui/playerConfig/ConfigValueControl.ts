import { Control } from "client/gui/Control";
import { ConfigPartDefinition } from "client/gui/buildmode/ConfigControl";

export class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}
