import { Players, UserInputService } from "@rbxts/services";
import GuiAbstractTool from "./GuiAbstractTool";
import GuiBuildTool from "./GuiBuildTool";
import GuiAnimations from "../GuiAnimations";
import PlayerUtils from "shared/utils/PlayerUtils";
import Logger from "shared/Logger";
import GuiDeleteTool from "./GuiDeleteTool";
import ControlUtils from "client/utils/ControlUtils";

export default class ToolsInterface {
	private gameUI: GameUI;

	// Variables
	public equippedTool: GuiAbstractTool | undefined;

	// Tools
	public tools: GuiAbstractTool[] = [];
	public buildTool: GuiBuildTool;
	public deleteTool: GuiDeleteTool;

	// Events
	public inputEvent: RBXScriptConnection;

	constructor(gameUI: GameUI) {
		// Define tools gui
		this.gameUI = gameUI;

		// Hide useless buttons for mobile
		if (ControlUtils.isMobile()) {
			this.gameUI.Tools.Buttons.GetChildren().forEach((child) => {
				if (child.IsA("Frame")) {
					(child as Frame & ToolsGuiButton).KeyboardButtonTooltip.Destroy();
				}
			});
		}

		// Tools API
		this.buildTool = new GuiBuildTool(gameUI, this);
		this.deleteTool = new GuiDeleteTool(gameUI, this);
		this.tools.push(this.buildTool);
		this.tools.push(this.deleteTool);

		// Events
		this.inputEvent = UserInputService.InputBegan.Connect((input, _) => this.onInput(input));

		// Initialization
		this.equippedTool = this.buildTool;
		this.equipTool(undefined, true);

		// GUI Terminate when unused
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** Function for tool switching */
	public equipTool(tool: GuiAbstractTool | undefined, isSilent: boolean = false): void {
		if (this.equippedTool === tool && this.equippedTool !== undefined) {
			this.equipTool(undefined);
			return;
		}

		// Call unequip of current tool
		if (this.equippedTool !== undefined) {
			this.equippedTool.onUnequip();
		}

		this.equippedTool = tool;

		// Call equip of a new tool
		if (this.equippedTool !== undefined) {
			this.equippedTool.onEquip();
		}

		// State GUI change
		if (this.equippedTool !== undefined) {
			GuiAnimations.fade(this.gameUI.ModeLabel, 0.1, "top");
			this.gameUI.ModeLabel.Text = this.equippedTool.getDisplayName();
		} else {
			this.gameUI.ModeLabel.Text = "";
		}

		// Play sound
		if (!isSilent) {
			this.gameUI.Sounds.GuiClick.Play();
		}
	}

	public onInput(input: InputObject) {
		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// PC
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			const tool = this.tools.find((value) => value.getEquipButton() === input.KeyCode);
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
					return tool.getEquipButton().Value === this.equippedTool.getEquipButton().Value + increment;
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

		this.inputEvent.Disconnect();

		// Terminate all tools
		for (let i = 0; i < this.tools.size(); i++) {
			const element = this.tools[i];
			element.onUnequip();
			element.terminate();
		}

		script.Destroy();
	}
}
