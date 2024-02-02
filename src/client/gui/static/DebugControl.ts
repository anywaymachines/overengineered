import GuiController from "client/controller/GuiController";
import Control from "client/gui/Control";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import GuiAnimator from "../GuiAnimator";
import { LogControlDefinition } from "./LogControl";

export type DebugControlDefinition = LogControlDefinition;

export default class DebugControl extends Control<DebugControlDefinition> {
	public static readonly instance = new DebugControl(
		GuiController.getGameUI<{
			Static: {
				DebugGui: DebugControlDefinition;
			};
		}>().Static.DebugGui,
	);

	private readonly lineTemplate;

	constructor(gui: DebugControlDefinition) {
		super(gui);
		this.lineTemplate = Control.asTemplate(this.gui.Template);

		this.event.subscribe(Logger.onLog, (text, isError) => {
			this.addLine(`■ [DEBUG] ${text}`, isError ? Color3.fromRGB(255, 0, 0) : Color3.fromRGB(52, 154, 213));
		});

		Remotes.Client.GetNamespace("Debug")
			.Get("DisplayLine")
			.Connect((text: string, isClient: boolean, isError: boolean) => {
				this.addLine(
					`■ [DEBUG] ${text}`,
					isError
						? Color3.fromRGB(255, 0, 0)
						: isClient
						  ? Color3.fromRGB(52, 154, 213)
						  : Color3.fromRGB(0, 204, 103),
				);
			});
	}

	public addLine(text: string, color: Color3 = Color3.fromRGB(255, 255, 255)) {
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
