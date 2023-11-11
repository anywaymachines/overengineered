import { StarterGui } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import BuildTool from "client/tools/BuildTool";
import MoveTool from "client/tools/MoveTool";
import GuiAnimator from "../GuiAnimator";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";

/** Widget-a substitute for the native Roblox Backpack */
export default class ToolbarWidget extends Widget {
	private gui: ToolbarGui;

	// Colors
	private readonly ACTIVE_COLOR = Color3.fromHex("#505050");
	private readonly COLOR = Color3.fromHex("#2f2f2f");

	/** A variable that stores the class of the selected tool */
	private currentTool?: ToolBase;

	/** An array containing all kinds of tools */
	private tools: ToolBase[] = [];
	private toolsButtons: ToolbarButton[] = [];

	constructor(gui: ToolbarGui) {
		super();

		this.gui = gui;

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		// Creating tools
		this.tools.push(new BuildTool());
		this.tools.push(new MoveTool());

		// Preparation
		const gameUI = GuiController.getGameUI();
		const template = gameUI.ToolbarGui.Buttons.Template.Clone();

		// Creating buttons
		let i = 1;
		this.tools.forEach((tool) => {
			const button = template.Clone();

			button.Name = tool.getDisplayName();
			button.ImageLabel.Image = tool.getImageID();
			button.KeyboardNumberLabel.Text = tostring(i);
			button.Parent = gui.Buttons;

			// Equip on click
			this.eventHandler.subscribe(button.MouseButton1Click, () => this.setTool(tool));

			this.toolsButtons.push(button);
			i++;
		});

		// Remove template
		gameUI.ToolbarGui.Buttons.Template.Destroy();
	}

	private setTool(tool?: ToolBase) {
		// De-select algorythm
		if (this.currentTool === tool && this.currentTool !== undefined) {
			this.setTool(undefined);
			return;
		}

		// Call unequip of current tool
		if (this.currentTool !== undefined) {
			Signals.TOOL.UNEQUIPPED.Fire(this.currentTool);

			// Update texts
			this.gui.NameLabel.Text = "";
			this.gui.DescriptionLabel.Text = "";

			this.currentTool.deactivate();
		}

		this.currentTool = tool;

		// Call equip of a new tool
		if (this.currentTool !== undefined) {
			Signals.TOOL.EQUIPPED.Fire(this.currentTool);

			// Update texts
			this.gui.NameLabel.Text = this.currentTool.getDisplayName();
			this.gui.DescriptionLabel.Text = this.currentTool.getShortDescription();
			GuiAnimator.transition(this.gui.NameLabel, 0.1, "up", 25);
			GuiAnimator.transition(this.gui.DescriptionLabel, 0.1, "up", 25);

			this.currentTool.activate();
		}

		// Play sound
		SoundController.Sounds.GuiClick.Play();

		// Update GUI
		this.toolsButtons.forEach((button) => {
			if (this.currentTool && button.Name === this.currentTool.getDisplayName()) {
				GuiAnimator.tweenColor(button, this.ACTIVE_COLOR, 0.1);
			} else {
				GuiAnimator.tweenColor(button, this.COLOR, 0.1);
			}
		});
	}

	protected prepareDesktop(): void {
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
		];

		this.tools.forEach((tool, i) => {
			this.inputHandler.onKeyPressed(keycodes[i], () => this.setTool(tool));
		});
	}

	protected prepareGamepad(): void {
		// Empty
	}

	protected prepareTouch(): void {
		// Empty
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	showWidget(hasAnimations: boolean): void {
		this.gui.Visible = true;

		if (hasAnimations) {
			GuiAnimator.transition(this.gui, 0.2, "up");
		}

		super.showWidget(hasAnimations);
	}
}
