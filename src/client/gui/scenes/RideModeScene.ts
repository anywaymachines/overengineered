import Control from "client/base/Control";
import Signals from "client/event/Signals";
import Remotes from "shared/Remotes";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		this.event.subscribe(this.gui.Stop.Activated, async () => {
			// await Remotes.Client.GetNamespace("Ride").Get("RideStartRequest").CallServerAsync();
			Signals.PLAY_MODE.set("build");
		});
	}
}

export type RideModeSceneDefinition = Folder & {
	ActionBarGui: ActionBarControlDefinition;
};

export default class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();
	}
}
