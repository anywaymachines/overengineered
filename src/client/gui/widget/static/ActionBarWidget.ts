import StaticWidget from "client/base/StaticWidget";
import GuiController from "client/controller/GuiController";
import Signals from "client/event/Signals";
import GuiAnimator from "client/gui/GuiAnimator";
import Remotes from "shared/Remotes";

export default class ActionBarWidget extends StaticWidget {
	private gui: ActionBarGui;

	constructor() {
		super();
		this.gui = this.getGui();

		this.gui.Visible = true;
		this.prepare();
	}

	private getGui() {
		if (!(this.gui && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().ActionBarGui;
		}

		return this.gui;
	}

	protected prepare(): void {
		super.prepare();

		this.eventHandler.subscribe(Signals.TOOL.UNEQUIPPED, () => {
			this.gui.Visible = true;
			GuiAnimator.transition(this.gui, 0.2, "down");
		});

		this.eventHandler.subscribe(Signals.TOOL.EQUIPPED, () => {
			this.gui.Visible = false;
		});

		this.eventHandler.subscribe(this.gui.Buttons.Run.MouseButton1Click, async () => {
			await Remotes.Client.GetNamespace("Ride").Get("RideStartRequest").CallServerAsync();
		});
	}

	protected prepareDesktop(): void {
		// Empty
	}

	protected prepareGamepad(): void {
		// Empty
	}

	protected prepareTouch(): void {
		// Empty
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}
}
