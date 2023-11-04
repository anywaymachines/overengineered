import ClientSignals from "client/ClientSignals";
import AbstractGUI from "./abstract/AbstractGUI";
import GuiAnimations from "./GuiAnimations";

export default class ActionBarGUI extends AbstractGUI {
	constructor(gameUI: GameUI) {
		super(gameUI);

		this.prepareEvents();
	}

	public prepareEvents() {
		this.eventHandler.registerEvent(ClientSignals.TOOL_EQUIPED, () => {
			this.updateGUI(false);
		});

		this.eventHandler.registerEvent(ClientSignals.TOOL_UNEQUIPED, () => {
			this.updateGUI(true);
		});
	}

	public displayDefaultGUI(isVisible: boolean): void {
		this.gameUI.ActionBar.Visible = isVisible;
	}

	public updateGUI(isVisible: boolean) {
		if (isVisible) {
			this.gameUI.ActionBar.Visible = true;
			GuiAnimations.fade(this.gameUI.ActionBar, 0.1, "down");
		} else {
			this.gameUI.ActionBar.Visible = false;
		}
	}

	public onInput(input: InputObject): void {}

	public onPlatformChanged(newPlatform: "Console" | "Touch" | "Desktop"): void {}
}
