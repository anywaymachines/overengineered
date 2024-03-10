import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";

export type LogControlDefinition = GuiObject & {
	Template: Frame & {
		TextLabel: TextLabel;
	};
};

export default class LogControl extends Control<LogControlDefinition> {
	public static readonly instance = new LogControl(
		Gui.getGameUI<{
			Log: LogControlDefinition;
		}>().Log,
	);

	private readonly lineTemplate;

	constructor(gui: LogControlDefinition) {
		super(gui);
		this.lineTemplate = this.asTemplate(this.gui.Template);
	}

	public addLine(text: string, color: Color3 = Colors.white) {
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
