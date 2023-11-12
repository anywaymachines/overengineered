import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import GuiAnimator from "client/gui/GuiAnimator";

export default class ConfirmWidget extends Widget {
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

	protected prepareDesktop(): void {}
	protected prepareTouch(): void {}
	protected prepareGamepad(): void {}

	private prepareCustomEvents(callback: Callback): void {
		// Events
		this.eventHandler.subscribeOnce(this.gui.Answers.YesButton.MouseButton1Click, () => {
			this.hideWidget(true);
			SoundController.getSounds().GuiClick.Play();
			callback();
		});
		this.eventHandler.subscribeOnce(this.gui.Answers.NoButton.MouseButton1Click, () => {
			this.hideWidget(true);
			SoundController.getSounds().GuiClick.Play();
		});
		this.eventHandler.subscribeOnce(this.gui.CloseButton.MouseButton1Click, () => {
			this.hideWidget(true);
			SoundController.getSounds().GuiClick.Play();
		});
	}

	display(heading: string, text: string, callback: Callback): void {
		super.showWidget(true);

		// Display
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.1, "up");

		// Update texts
		this.gui.HeadingLabel.Text = heading;
		this.gui.DescriptionLabel.Text = text;

		this.prepareCustomEvents(() => {
			this.hideWidget(true);
			callback();
		});
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}
}
