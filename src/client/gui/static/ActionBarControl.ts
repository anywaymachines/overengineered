import Scene from "client/base/Scene";
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

export class ActionBarControl extends Scene<ActionBarControlDefinition> {
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
