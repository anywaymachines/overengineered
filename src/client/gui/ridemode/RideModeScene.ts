import Control from "client/base/Control";
import BlockLogicController from "client/controller/BlockLogicController";
import PlayModeController from "client/controller/PlayModeController";
import RocketEngineGui, { RocketEngineGuiDefinition } from "./RocketEngineGui";
import { ButtonControl } from "../controls/Button";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop), false);
		this.event.subscribe(stopButton.activated, async () => {
			await PlayModeController.instance.requestMode("build");
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
		this.add(blocksgui, false);

		const torque = new RocketEngineGui(this.gui.Torque);
		this.add(torque);

		blocksgui.clear();
		for (const block of BlockLogicController.getBlocks()) {
			//
		}

		// const blocks = SharedPlots.getPlotBlocks(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
	}
}
