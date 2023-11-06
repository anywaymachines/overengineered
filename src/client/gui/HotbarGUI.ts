import { Players } from "@rbxts/services";
import AbstractToolMeta from "../core/abstract/AbstractToolMeta";
import BuildToolMeta from "../tools/BuildToolMeta";
import GuiAnimations from "../utils/GuiAnimations";
import PlayerUtils from "shared/utils/PlayerUtils";
import DeleteToolMeta from "../tools/DeleteToolMeta";
import Signals from "client/core/network/Signals";
import AbstractGUI from "../core/abstract/AbstractGUI";
import InputController from "client/core/InputController";

export default class HotbarGUI extends AbstractGUI {
	// Variables
	public equippedTool?: AbstractToolMeta;

	// Tools
	public tools: AbstractToolMeta[] = [];
	public buildTool: BuildToolMeta;
	public deleteTool: DeleteToolMeta;

	constructor(gameUI: GameUI) {
		super(gameUI);

		// Tools API
		this.buildTool = new BuildToolMeta(gameUI);
		this.deleteTool = new DeleteToolMeta(gameUI);
		this.tools.push(this.buildTool);
		this.tools.push(this.deleteTool);

		// Equip nothing
		this.equipTool(undefined, true);

		this.tools.forEach((tool) => {
			this.eventHandler.registerEvent(tool.getButton().ImageButton.MouseButton1Click, () => this.equipTool(tool));
		});
	}

	public displayDefaultGUI(isVisible: boolean): void {
		this.gameUI.Tools.Visible = isVisible;
		this.gameUI.CurrentToolLabel.Visible = isVisible;
		this.gameUI.CurrentToolDescriptionLabel.Visible = isVisible;
	}

	/** Function for tool switching */
	public equipTool(tool?: AbstractToolMeta, isSilent: boolean = false): void {
		if (this.equippedTool === tool && this.equippedTool !== undefined) {
			this.equipTool(undefined);
			return;
		}

		// Call unequip of current tool
		if (this.equippedTool !== undefined) {
			Signals.TOOL.UNEQUIPPED.Fire(this.equippedTool);
			this.equippedTool.onUnequip();
		}

		this.equippedTool = tool;

		// Call equip of a new tool
		if (this.equippedTool !== undefined) {
			Signals.TOOL.EQUIPPED.Fire(this.equippedTool);
			this.equippedTool.onEquip();
		}

		// State GUI change
		if (this.equippedTool !== undefined) {
			GuiAnimations.fade(this.gameUI.CurrentToolLabel, 0.1, "up");
			GuiAnimations.fade(this.gameUI.CurrentToolDescriptionLabel, 0.1, "up");
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolLabel, 0, 0.1);
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolDescriptionLabel, 0, 0.1);

			this.gameUI.CurrentToolLabel.Text = this.equippedTool.getDisplayName();
			this.gameUI.CurrentToolDescriptionLabel.Text = this.equippedTool.getShortDescription();
		} else {
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolLabel, 1, 0.1);
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolDescriptionLabel, 1, 0.1);
		}

		// Play sound
		if (!isSilent) {
			this.gameUI.Sounds.GuiClick.Play();
		}
	}

	public onPlatformChanged(platform: typeof InputController.currentPlatform) {
		// Update buttons
		this.gameUI.Tools.Buttons.GetChildren().forEach((child) => {
			if (child.IsA("Frame")) {
				const tooltip = (child as Frame & MyToolsGuiButton).KeyboardButtonTooltip;
				if (platform === "Desktop") {
					GuiAnimations.fade(tooltip, 0.1, "down");
					GuiAnimations.tweenTransparency(tooltip, 0, 0.1);
				} else {
					GuiAnimations.tweenTransparency(tooltip, 1, 0.1);
				}
			}
		});
	}

	public onInput(input: InputObject) {
		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// PC
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			const tool = this.tools.find((value) => value.getKeybind() === input.KeyCode);
			if (tool) {
				this.equipTool(tool);
				return;
			}
		}

		// Keyboard backspace for tool unequipping
		if (input.KeyCode === Enum.KeyCode.Backspace) {
			this.equipTool(undefined);
			return;
		}

		// Gamepad ButtonB for tool unequipping
		if (input.KeyCode === Enum.KeyCode.ButtonB) {
			this.equipTool(undefined);
			return;
		}

		// Gamepad ButtonR1, ButtonR2 for tool selection
		if (input.KeyCode === Enum.KeyCode.ButtonR1 || input.KeyCode === Enum.KeyCode.ButtonR1) {
			if (this.equippedTool) {
				const isRight = input.KeyCode === Enum.KeyCode.ButtonR1;
				const increment = isRight ? 1 : -1;
				const tool = this.tools.find((tool) => {
					assert(this.equippedTool, "");
					return tool.getKeybind().Value === this.equippedTool.getKeybind().Value + increment;
				});
				if (tool) {
					this.equipTool(tool);
					return;
				}
			} else {
				this.equipTool(this.buildTool);
				return;
			}
		}
	}

	public terminate() {
		// Unequip tools
		this.equipTool(undefined, true);

		// Terminate tools
		for (let i = 0; i < this.tools.size(); i++) {
			const element = this.tools[i];
			element.terminate();
		}

		super.terminate();
	}
}
