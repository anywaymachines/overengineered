import Signals from "client/core/network/Signals";
import AbstractGUI from "../core/abstract/AbstractGUI";
import GuiAnimations from "../utils/GuiAnimations";

export default class ActionBarGUI extends AbstractGUI {
	constructor(gameUI: GameUI) {
		super(gameUI);

		this.prepareEvents();
	}

	public prepareEvents() {
		this.eventHandler.registerEvent(Signals.TOOL.EQUIPPED, () => {
			this.updateGUI(false);
		});

		this.eventHandler.registerEvent(Signals.TOOL.UNEQUIPPED, () => {
			this.updateGUI(true);
		});

		this.eventHandler.registerEvent(this.gameUI.ActionBar.Buttons.Run.MouseButton1Click, () => {
			Signals.RIDE_REQUEST.Fire();
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
