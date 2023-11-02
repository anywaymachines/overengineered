import { Players, UserInputService } from "@rbxts/services";
import AbstractToolMeta from "./abstract/AbstractToolMeta";
import BuildToolMeta from "../tools/BuildToolMeta";
import GuiAnimations from "./GuiAnimations";
import PlayerUtils from "shared/utils/PlayerUtils";
import Logger from "shared/Logger";
import DeleteToolGui from "../tools/DeleteToolMeta";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import GameControls from "client/GameControls";
import ClientSignals from "client/ClientSignals";

export default class ToolsGui {
	public gameUI: MyGui;

	// Variables
	public equippedTool?: AbstractToolMeta;

	// Tools
	public tools: AbstractToolMeta[] = [];
	public buildTool: BuildToolMeta;
	public deleteTool: DeleteToolGui;

	constructor(gameUI: MyGui) {
		// Define tools gui
		this.gameUI = gameUI;

		// Tools API
		this.buildTool = new BuildToolMeta(gameUI, this);
		this.deleteTool = new DeleteToolGui(gameUI, this);
		this.buildTool.onUnequip();
		this.deleteTool.onUnequip();
		this.tools.push(this.buildTool);
		this.tools.push(this.deleteTool);

		// Events
		AliveEventsHandler.registerAliveEvent(UserInputService.InputBegan, (input: InputObject, _: boolean) =>
			this.onInput(input),
		);

		// Initialization
		this.equipTool(undefined, true);

		// GUI Terminate when unused
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());

		this.onPlatformChanged(GameControls.getActualPlatform());
	}

	/** Function for tool switching */
	public equipTool(tool?: AbstractToolMeta, isSilent: boolean = false): void {
		if (this.equippedTool === tool && this.equippedTool !== undefined) {
			this.equipTool(undefined);
			return;
		}

		// Call unequip of current tool
		if (this.equippedTool !== undefined) {
			ClientSignals.TOOL_UNEQUIPED.Fire(this.equippedTool);
			this.equippedTool.onUnequip();
		}

		this.equippedTool = tool;

		// Call equip of a new tool
		if (this.equippedTool !== undefined) {
			ClientSignals.TOOL_EQUIPED.Fire(this.equippedTool);
			this.equippedTool.onEquip();
		}

		// State GUI change
		if (this.equippedTool !== undefined) {
			GuiAnimations.fade(this.gameUI.CurrentToolLabel, 0.2, "up");
			GuiAnimations.fade(this.gameUI.CurrentToolDescriptionLabel, 0.2, "up");
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolLabel, 0, 0.2);
			GuiAnimations.tweenTransparency(this.gameUI.CurrentToolDescriptionLabel, 0, 0.2);

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

	public onPlatformChanged(platform: string) {
		// Update tools
		this.tools.forEach((value) => {
			value.onPlatformChanged(platform);
		});

		// Update buttons
		this.gameUI.Tools.Buttons.GetChildren().forEach((child) => {
			if (child.IsA("Frame")) {
				const tooltip = (child as Frame & MyToolsGuiButton).KeyboardButtonTooltip;
				if (platform === "Desktop") {
					GuiAnimations.fade(tooltip, 0.1, "down");
					GuiAnimations.tweenTransparency(tooltip, 0, 0.1);
				} else {
					GuiAnimations.tweenTransparency(tooltip, 1, 0.1);
					//tooltip.Visible = false;
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
		Logger.info("Terminating ToolsInterface");

		this.equipTool(undefined, true);

		// Terminate all tools
		for (let i = 0; i < this.tools.size(); i++) {
			const element = this.tools[i];
			element.onUnequip();
			element.terminate();
		}

		script.Destroy();
	}
}
