import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import { LogControlDefinition } from "./LogControl";

export type DebugControlDefinition = LogControlDefinition;

export default class DebugControl extends Control<DebugControlDefinition> {
	public static readonly instance = new DebugControl(
		Gui.getGameUI<{
			Debug: DebugControlDefinition;
		}>().Debug,
	);

	private readonly lineTemplate;

	constructor(gui: DebugControlDefinition) {
		super(gui);
		this.lineTemplate = this.asTemplate(this.gui.Template);

		this.event.subscribe(Logger.onLog, (text, isError) => {
			this.addLine(`■ [DEBUG] ${text}`, isError ? Colors.red : Colors.blue);
		});

		Remotes.Client.GetNamespace("Debug")
			.Get("DisplayLine")
			.Connect((text: string, isClient: boolean, isError: boolean) => {
				this.addLine(`■ [DEBUG] ${text}`, isError ? Colors.red : isClient ? Colors.blue : Colors.green);
			});
	}

	public addLine(text: string, color: Color3 = Colors.white) {
		const line = this.lineTemplate();
		line.TextLabel.Text = text;
		line.TextLabel.TextColor3 = color;
		line.Parent = this.gui;

		GuiAnimator.transition(line.TextLabel, 0.3, "left");
		spawn(() => {
			wait(15);
			GuiAnimator.revTransition(line.TextLabel, 0.3, "left");
			GuiAnimator.tweenTransparency(line.TextLabel, 1, 0.25);
			wait(0.3);
			line.Destroy();
		});
	}
}
