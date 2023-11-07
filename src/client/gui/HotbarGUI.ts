import AbstractToolMeta from "../core/abstract/AbstractToolMeta";
import BuildToolMeta from "../tools/BuildToolMeta";
import GuiAnimations from "../utils/GuiAnimations";
import DeleteToolMeta from "../tools/DeleteToolMeta";
import Signals from "client/core/network/Signals";
import AbstractGUI from "../core/abstract/AbstractGUI";
import InputController from "client/core/InputController";
import MoveToolMeta from "client/tools/MoveToolMeta";
import { StarterGui } from "@rbxts/services";

export default class HotbarGUI extends AbstractGUI {
	// Variables
	public equippedTool?: AbstractToolMeta;

	// Tools
	public tools: AbstractToolMeta[] = [];
	public buildTool: BuildToolMeta;
	public moveTool: MoveToolMeta;
	public deleteTool: DeleteToolMeta;

	constructor(gameUI: GameUI) {
		super(gameUI);

		// Tools API
		this.buildTool = new BuildToolMeta(gameUI);
		this.deleteTool = new DeleteToolMeta(gameUI);
		this.moveTool = new MoveToolMeta(gameUI);

		this.tools.push(this.buildTool);
		this.tools.push(this.deleteTool);
		this.tools.push(this.moveTool);

		// Equip nothing
		this.equipTool(undefined, true);

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		this.prepareEvents(InputController.currentPlatform);
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
		super.onPlatformChanged(platform);

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

	public registerSharedEvents(): void {
		super.registerSharedEvents();

		this.tools.forEach((tool) => {
			this.eventHandler.registerEvent(tool.getButton().ImageButton.MouseButton1Click, () => this.equipTool(tool));
		});
	}

	public registerDesktopEvents(): void {
		super.registerDesktopEvents();

		// Keyboard keybinds
		this.tools.forEach((tool) => {
			this.inputHandler.onKeyPressed(tool.getKeybind(), () => this.equipTool(tool));
		});

		this.inputHandler.onKeyPressed(Enum.KeyCode.Backspace, () => this.equipTool(undefined));
	}

	public registerConsoleEvents(): void {
		super.registerConsoleEvents();

		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonB, () => this.equipTool(undefined));
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonR1, () => this.gamepadSelectTool(true));
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonL1, () => this.gamepadSelectTool(false));
	}

	gamepadSelectTool(isRight: boolean) {
		if (this.equippedTool) {
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
