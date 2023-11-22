import StaticWidget from "client/base/StaticWidget";
import GuiController from "client/controller/GuiController";
import GuiAnimator from "client/gui/GuiAnimator";

export default class LogStaticWidget extends StaticWidget {
	public static readonly instance = new LogStaticWidget();

	private gui: LogGui;
	private lineTemplate: LogFrame;

	constructor() {
		super();
		this.gui = this.getGui();

		this.lineTemplate = this.gui.Template.Clone();
		this.gui.Template.Destroy();

		this.gui.Visible = true;
	}

	private getGui() {
		if (!(this.gui && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().Static.LogGui;
		}

		return this.gui;
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

	public addLine(text: string, color: Color3 = Color3.fromRGB(255, 255, 255)) {
		const line = this.lineTemplate.Clone();
		line.TextLabel.Text = text;
		line.TextLabel.TextColor3 = color;
		line.Parent = this.gui;
		GuiAnimator.transition(line.TextLabel, 0.3, "right");
		spawn(() => {
			wait(5);
			GuiAnimator.revTransition(line.TextLabel, 0.3, "right");
			GuiAnimator.tweenTransparency(line.TextLabel, 1, 0.25);
			wait(0.3);
			line.Destroy();
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
