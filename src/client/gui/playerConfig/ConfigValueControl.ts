import { GameLoader } from "client/GameLoader";
import { Control } from "client/gui/Control";
import type { ConfigPartDefinition } from "client/gui/popup/SettingsPopup";

GameLoader.waitForEverything();

export class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}
