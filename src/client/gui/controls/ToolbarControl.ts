import { StarterGui } from "@rbxts/services";
import Control from "client/base/Control";
import ToolController from "client/tools/ToolController";
import { ListControl } from "./ListControl";
import ToolBase from "client/base/ToolBase";
import GuiAnimator from "../GuiAnimator";
import SoundController from "client/controller/SoundController";
import TooltipController from "client/controller/TooltipController";

export type ToolbarButtonControlDefinition = TextButton & {
	ImageLabel: ImageLabel;
	KeyboardNumberLabel: TextLabel;
};

export class ToolbarButtonControl extends Control<ToolbarButtonControlDefinition> {
	// Colors
	private readonly activeColor = Color3.fromHex("#3c4250");
	private readonly inactiveColor = Color3.fromHex("#2c303d");

	constructor(gui: ToolbarButtonControlDefinition, tool: ToolBase) {
		super(gui);

		this.gui.Name = tool.getDisplayName();
		this.gui.ImageLabel.Image = tool.getImageID();
		this.gui.KeyboardNumberLabel.Text = tostring(ToolController.tools.indexOf(tool) + 1);

		this.event.subscribe(this.gui.Activated, () => ToolController.selectedTool.set(tool));
		this.event.subscribeObservable(
			ToolController.selectedTool,
			(newtool) => {
				// Update GUI
				if (newtool === tool) GuiAnimator.tweenColor(this.gui, this.activeColor, 0.2);
				else GuiAnimator.tweenColor(this.gui, this.inactiveColor, 0.2);
			},
			true,
		);
	}
}

export type ToolbarControlDefinition = GuiObject & {
	Buttons: GuiObject & {
		Template: ToolbarButtonControlDefinition;
	};
	NameLabel: TextLabel;
	DescriptionLabel: TextLabel;
};

export default class ToolbarControl extends Control<ToolbarControlDefinition> {
	constructor(gui: ToolbarControlDefinition) {
		super(gui);

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		const template = Control.asTemplate(this.gui.Buttons.Template);
		const toolButtons = new ListControl(this.gui.Buttons);
		this.add(toolButtons);

		// Creating buttons
		ToolController.tools.forEach((tool, i) => {
			const button = new ToolbarButtonControl(template(), tool);
			toolButtons.add(button);

			TooltipController.addSimpleTooltip({
				isEnabled: (inputType) => inputType === "Desktop",
				gui: button.getGui().KeyboardNumberLabel,
			});
		});

		this.event.subscribeObservable(ToolController.selectedTool, (tool) => this.toolChanged(tool));
		this.resetLabels();
	}

	private toolChanged(tool: ToolBase | undefined) {
		if (tool) {
			this.getGui().NameLabel.Text = tool.getDisplayName();
			this.getGui().DescriptionLabel.Text = tool.getShortDescription();

			GuiAnimator.transition(this.getGui().NameLabel, 0.2, "up", 25);
			GuiAnimator.transition(this.getGui().DescriptionLabel, 0.2, "up", 25);
		} else {
			this.resetLabels();
		}

		// Play sound
		SoundController.getSounds().Click.Play();
	}

	private resetLabels() {
		this.getGui().NameLabel.Text = "";
		this.getGui().DescriptionLabel.Text = "";
	}

	private gamepadSelectTool(isRight: boolean) {
		const tools = ToolController.tools;

		if (!ToolController.selectedTool.get()) {
			ToolController.selectedTool.set(tools[0]);
			return;
		}

		const currentIndex = tools.indexOf(ToolController.selectedTool.get()!);
		const toolsLength = tools.size();
		let newIndex = isRight ? currentIndex + 1 : currentIndex - 1;

		if (newIndex >= toolsLength) {
			newIndex = 0;
		} else if (newIndex < 0) {
			newIndex = toolsLength - 1;
		}

		ToolController.selectedTool.set(tools[newIndex]);
	}

	protected prepareDesktop() {
		const keycodes = [
			Enum.KeyCode.One,
			Enum.KeyCode.Two,
			Enum.KeyCode.Three,
			Enum.KeyCode.Four,
			Enum.KeyCode.Five,
			Enum.KeyCode.Six,
			Enum.KeyCode.Seven,
			Enum.KeyCode.Eight,
			Enum.KeyCode.Nine,
		] as const;

		ToolController.tools.forEach((tool, i) => {
			this.inputHandler.onKeyPressed(keycodes[i], () =>
				ToolController.selectedTool.set(tool === ToolController.selectedTool.get() ? undefined : tool),
			);
		});
	}

	protected prepareGamepad() {
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonB, () => ToolController.selectedTool.set(undefined));
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonR1, () => this.gamepadSelectTool(true));
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonL1, () => this.gamepadSelectTool(false));
	}
}
