import EventHandler from "client/event/EventHandler";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "./GuiAnimations";
import { GuiService } from "@rbxts/services";
import GameControls from "client/GameControls";

export default class ConfirmationWindow {
	private static gameDialog: ScreenGui & GameDialog = GuiUtils.getGameDialog() as ScreenGui & GameDialog;
	private static eventHandler: EventHandler = new EventHandler();

	static showConfirmationWindow(heading: string, text: string, callback: Callback) {
		if (this.eventHandler.size() > 0) {
			return;
		}

		this.gameDialog.ConfirmationWindow.HeadingLabel.Text = heading;
		this.gameDialog.ConfirmationWindow.DescriptionLabel.Text = text;
		this.gameDialog.ConfirmationWindow.Visible = true;

		GuiAnimations.fade(this.gameDialog.ConfirmationWindow, 0.1, "up");

		// Events
		this.eventHandler.registerOnce(this.gameDialog.ConfirmationWindow.Answers.YesButton.MouseButton1Click, () => {
			this.gameDialog.ConfirmationWindow.Visible = false;
			this.eventHandler.killAll();
			callback();
		});
		this.eventHandler.registerOnce(this.gameDialog.ConfirmationWindow.Answers.NoButton.MouseButton1Click, () => {
			this.gameDialog.ConfirmationWindow.Visible = false;
			this.eventHandler.killAll();
		});
		this.eventHandler.registerOnce(this.gameDialog.ConfirmationWindow.CloseButton.MouseButton1Click, () => {
			this.gameDialog.ConfirmationWindow.Visible = false;
			this.eventHandler.killAll();
		});

		if (GameControls.getActualPlatform() === "Console") {
			GuiService.SelectedObject = this.gameDialog.ConfirmationWindow.Answers.NoButton;
		}
	}
}
