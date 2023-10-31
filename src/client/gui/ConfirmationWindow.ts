import GuiUtils from "client/utils/GuiUtils";

export default class ConfirmationWindow {
	private static gameUI: ScreenGui & MyGui = GuiUtils.getGameUI() as ScreenGui & MyGui;

	static showConfirmationWindow(heading: string, text: string, callback: Callback) {
		// Hide all guis
		this.gameUI.Enabled = false;

		this.gameUI.ConfirmationWindow.HeadingLabel.Text = heading;
		this.gameUI.ConfirmationWindow.DescriptionLabel.Text = heading;
		this.gameUI.ConfirmationWindow.Visible = true;

		// TODO
	}
}
