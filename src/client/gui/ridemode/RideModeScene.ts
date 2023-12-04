import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
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
	private readonly controls;

	private readonly torqueTemplate;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();

		this.controls = new Control(this.gui);
		this.add(this.controls);

		this.torqueTemplate = Control.asTemplate(this.gui.Torque);
	}

	public start(machine: Machine) {
		this.controls.clear();
		machine.destroyed.Connect(() => this.controls.clear());

		const torque = new RocketEngineGui(this.torqueTemplate(), machine);
		torque.show();
		this.controls.add(torque);
	}
}
