import { StarterGui, UserInputService } from "@rbxts/services";
import Control from "client/base/Control";
import ToolBase from "client/base/ToolBase";
import SoundController from "client/controller/SoundController";
import ToolController from "client/controller/ToolController";
import GuiAnimator from "../GuiAnimator";

export type ToolbarButtonControlDefinition = TextButton & {
	ImageLabel: ImageLabel;
	KeyboardNumberLabel: TextLabel;
};

export class ToolbarButtonControl extends Control<ToolbarButtonControlDefinition> {
	// Colors
	private readonly activeColor = Color3.fromHex("#3c4250");
	private readonly inactiveColor = Color3.fromHex("#2c303d");

	constructor(gui: ToolbarButtonControlDefinition, tools: ToolController, tool: ToolBase) {
		super(gui);

		this.gui.Name = tool.getDisplayName();
		this.gui.ImageLabel.Image = tool.getImageID();
		this.gui.KeyboardNumberLabel.Text = tostring(tools.tools.indexOf(tool) + 1);

		this.event.subscribe(this.gui.Activated, () =>
			tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool),
		);
		this.event.subscribeObservable(
			tools.selectedTool,
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
	GamepadBack: ImageLabel;
	GamepadNext: ImageLabel;
};

export default class ToolbarControl extends Control<ToolbarControlDefinition> {
	private readonly tools;

	constructor(tools: ToolController, gui: ToolbarControlDefinition) {
		super(gui);
		this.tools = tools;

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		const template = Control.asTemplate(this.gui.Buttons.Template);
		const toolButtons = new Control<GuiObject, ToolbarButtonControl>(this.gui.Buttons);
		this.add(toolButtons);

		// Creating buttons
		for (const tool of tools.tools) {
			const button = new ToolbarButtonControl(template(), tools, tool);
			toolButtons.add(button);
		}

		this.event.onPrepare((inputType) => {
			const tween = (element: GuiObject, enabled: boolean) => {
				if (enabled) {
					GuiAnimator.tweenTransparency(element, 0, 0.2);
					GuiAnimator.transition(element, 0.2, "up");
				} else {
					GuiAnimator.tweenTransparency(element, 1, 0.2);
				}
			};

			for (const button of toolButtons.getChildren()) {
				tween(button.getGui().KeyboardNumberLabel, inputType === "Desktop");
			}

			tween(this.gui.GamepadBack, inputType === "Gamepad");
			tween(this.gui.GamepadNext, inputType === "Gamepad");
		});

		this.event.onPrepareGamepad(() => {
			this.gui.GamepadBack.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonL1);
			this.gui.GamepadNext.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonR1);
		});

		this.event.onPrepareDesktop(() => {
			const keycodes: readonly KeyCode[] = [
				"One",
				"Two",
				"Three",
				"Four",
				"Five",
				"Six",
				"Seven",
				"Eight",
				"Nine",
			];

			this.tools.tools.forEach((tool, i) => {
				this.inputHandler.onKeyDown(keycodes[i], () =>
					this.tools.selectedTool.set(tool === this.tools.selectedTool.get() ? undefined : tool),
				);
			});
		});

		this.event.onPrepareGamepad(() => {
			this.inputHandler.onKeyDown("ButtonB", () => this.tools.selectedTool.set(undefined));
			this.inputHandler.onKeyDown("ButtonR1", () => this.gamepadSelectTool(true));
			this.inputHandler.onKeyDown("ButtonL1", () => this.gamepadSelectTool(false));
		});

		this.event.subscribeObservable(tools.selectedTool, (tool) => this.toolChanged(tool));
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
		const tools = this.tools.tools;

		if (!this.tools.selectedTool.get()) {
			this.tools.selectedTool.set(tools[0]);
			return;
		}

		const currentIndex = tools.indexOf(this.tools.selectedTool.get()!);
		const toolsLength = tools.size();
		let newIndex = isRight ? currentIndex + 1 : currentIndex - 1;

		if (newIndex >= toolsLength) {
			newIndex = 0;
		} else if (newIndex < 0) {
			newIndex = toolsLength - 1;
		}

		this.tools.selectedTool.set(tools[newIndex]);
	}
}
