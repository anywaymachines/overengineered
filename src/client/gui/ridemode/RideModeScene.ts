import Control from "client/base/Control";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import { ButtonControl } from "../controls/Button";
import RocketEngineGui, { RocketEngineGuiDefinition } from "./RocketEngineGui";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop));
		this.event.subscribe(stopButton.activated, async () => {
			await requestMode("build");
		});
	}
}

export type RideModeSceneDefinition = GuiObject & {
	ActionBarGui: ActionBarControlDefinition;
	Torque: RocketEngineGuiDefinition;
};

export default class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();

		const blocksgui = new Control(this.gui);
		this.add(blocksgui);

		const torque = new RocketEngineGui(this.gui.Torque);
		this.add(torque);

		blocksgui.clear();
	}
}
