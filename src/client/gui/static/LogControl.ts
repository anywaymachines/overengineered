import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import GuiAnimator from "../GuiAnimator";

export type LogControlDefinition = GuiObject & {
	Template: Frame & {
		TextLabel: TextLabel;
	};
};

export default class LogControl extends Control<LogControlDefinition> {
	public static readonly instance = new LogControl(
		GuiController.getGameUI<{
			Static: {
				LogGui: LogControlDefinition;
			};
		}>().Static.LogGui,
	);

	private readonly lineTemplate;

	constructor(gui: LogControlDefinition) {
		super(gui);
		this.lineTemplate = Control.asTemplate(this.gui.Template);
	}

	public addLine(text: string, color: Color3 = Color3.fromRGB(255, 255, 255)) {
		const line = this.lineTemplate();
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
}
