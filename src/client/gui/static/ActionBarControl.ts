import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import Signals from "client/event/Signals";
import GuiAnimator from "../GuiAnimator";
import Remotes from "shared/Remotes";

export type ActionBarControlDefinition = GuiObject & {
	Buttons: {
		Run: GuiButton;
		Save: GuiButton;
		Settings: GuiButton;
	};
};

export class ActionBarControl extends Control<ActionBarControlDefinition> {
	public static readonly instance = new ActionBarControl(
		GuiController.getGameUI<{
			BuildingMode: { ActionBarGui: ActionBarControlDefinition };
		}>().BuildingMode.ActionBarGui,
	);

	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		this.event.subscribe(Signals.TOOL.UNEQUIPPED, () => {
			this.gui.Visible = true;
			GuiAnimator.transition(this.gui, 0.2, "down");
		});

		this.event.subscribe(Signals.TOOL.EQUIPPED, () => {
			this.gui.Visible = false;
		});

		this.event.subscribe(this.gui.Buttons.Run.MouseButton1Click, async () => {
			await Remotes.Client.GetNamespace("Ride").Get("RideStartRequest").CallServerAsync();
		});
	}
}
