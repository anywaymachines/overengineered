import { StarterGui, UserInputService } from "@rbxts/services";
import SoundController from "client/controller/SoundController";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import ToolBase from "client/tools/ToolBase";
import ToolController from "client/tools/ToolController";

export type ToolbarButtonControlDefinition = TextButton & {
	readonly ImageLabel: ImageLabel;
	readonly KeyboardNumberLabel: TextLabel;
};

export class ToolbarButtonControl extends Control<ToolbarButtonControlDefinition> {
	// Colors
	private readonly activeColor = Color3.fromRGB(85, 170, 255);
	private readonly inactiveColor = Color3.fromRGB(18, 18, 31);
	private readonly activeImageColor = Color3.fromRGB(0, 0, 0);
	private readonly inactiveImageColor = Color3.fromRGB(220, 220, 255);

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
				if (newtool === tool) {
					GuiAnimator.tweenColor(this.gui, this.activeColor, 0.2);
					GuiAnimator.tween(
						this.gui.ImageLabel,
						{ ImageColor3: this.activeImageColor },
						new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);
				} else {
					GuiAnimator.tweenColor(this.gui, this.inactiveColor, 0.2);
					GuiAnimator.tween(
						this.gui.ImageLabel,
						{ ImageColor3: this.inactiveImageColor },
						new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);
				}
			},
			true,
		);
	}
}

export type ToolbarControlDefinition = GuiObject & {
	readonly Buttons: GuiObject & {
		readonly Template: ToolbarButtonControlDefinition;
	};
	readonly Info: {
		readonly NameLabel: TextLabel;
	};
	readonly GamepadBack: ImageLabel;
	readonly GamepadNext: ImageLabel;
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

			print("!!!!!!!!!!!!!!!!!! prepare desktop ");
			this.tools.tools.forEach((tool, i) => {
				this.inputHandler.onKeyDown(keycodes[i], () =>
					this.tools.selectedTool.set(tool === this.tools.selectedTool.get() ? undefined : tool),
				);
				this.inputHandler.onKeyDown(keycodes[i], () => print("set setool " + this.tools.selectedTool.get()));
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
			this.getGui().Info.NameLabel.Text = tool.getDisplayName();

			GuiAnimator.transition(this.getGui().Info.NameLabel, 0.2, "up", 25);
		} else {
			this.resetLabels();
		}

		// Play sound
		SoundController.getSounds().Click.Play();
	}

	private resetLabels() {
		this.getGui().Info.NameLabel.Text = "";
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
