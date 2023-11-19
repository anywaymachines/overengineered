import StaticWidget from "client/base/StaticWidget";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import GuiAnimator from "client/gui/GuiAnimator";

/** Widget window with a choice of Yes or No */
export default class ConfirmWidget extends StaticWidget {
	private gui: ConfirmGui;

	constructor() {
		super();
		this.gui = this.getGui();
	}

	private getGui() {
		if (!(this.gui && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().ConfirmGui;
		}

		return this.gui;
	}

	private prepareCustomEvents(callback: Callback): void {
		// Events
		this.eventHandler.subscribeOnce(this.gui.Answers.YesButton.MouseButton1Click, () => {
			this.hideWidget();
			SoundController.getSounds().GuiClick.Play();
			callback();
		});
		this.eventHandler.subscribeOnce(this.gui.Answers.NoButton.MouseButton1Click, () => {
			this.hideWidget();
			SoundController.getSounds().GuiClick.Play();
		});
		this.eventHandler.subscribeOnce(this.gui.CloseButton.MouseButton1Click, () => {
			this.hideWidget();
			SoundController.getSounds().GuiClick.Play();
		});
	}

	protected prepareDesktop(): void {}

	protected prepareGamepad(): void {}

	protected prepareTouch(): void {}

	display(heading: string, text: string, callback: Callback): void {
		if (this.isVisible()) {
			return;
		}

		// Display
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.2, "up");

		// Update texts
		this.gui.HeadingLabel.Text = heading;
		this.gui.DescriptionLabel.Text = text;

		this.prepareCustomEvents(() => {
			this.hideWidget();
			callback();
		});
	}

	hideWidget(): void {
		super.hideWidget();

		this.gui.Visible = false;
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}
}
