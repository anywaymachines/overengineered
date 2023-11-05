import EventHandler from "shared/event/EventHandler";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "../utils/GuiAnimations";
import { GuiService } from "@rbxts/services";
import InputController from "client/core/InputController";

export default class ConfirmPopupGUI {
	private static gameDialog: ScreenGui & GameDialog = GuiUtils.getGameDialog() as ScreenGui & GameDialog;
	private static eventHandler: EventHandler = new EventHandler();

	static showConfirmationWindow(heading: string, text: string, callback: Callback) {
		if (this.eventHandler.size() > 0) {
			return;
		}

		// Update heading and description
		this.gameDialog.ConfirmationWindow.HeadingLabel.Text = heading;
		this.gameDialog.ConfirmationWindow.DescriptionLabel.Text = text;

		// Display with animation
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

		// Autoselect button on gamepad
		if (InputController.currentPlatform === "Console") {
			GuiService.SelectedObject = this.gameDialog.ConfirmationWindow.Answers.NoButton;
		}
	}
}
