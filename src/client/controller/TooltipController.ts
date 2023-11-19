import Signals from "client/event/Signals";
import GuiController from "./GuiController";
import GuiAnimator from "client/gui/GuiAnimator";
import InputController from "./InputController";
import { UserInputService } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";

type SimpleTooltip = {
	isEnabled: (inputType: typeof InputController.inputType) => boolean;
	gui: GuiObject;
	updateFunc?: (inputType: typeof InputController.inputType, info: SimpleTooltip) => void;
};

export default class TooltipController {
	private static gameUI: GameUI = GuiController.getGameUI();
	private static simpleTooltips: SimpleTooltip[] = [];

	// Templates
	private static gamepadTooltipTemplate: GamepadTooltip;
	private static keyboardTooltipTemplate: KeyboardTooltip;

	private static tooltips: (typeof this.gamepadTooltipTemplate | typeof this.keyboardTooltipTemplate)[] = [];
	private static currentTool?: ToolBase;

	static init() {
		// Init templates
		this.gamepadTooltipTemplate = this.gameUI.ControlTooltips.GamepadTemplate.Clone();
		this.keyboardTooltipTemplate = this.gameUI.ControlTooltips.KeyboardTemplate.Clone();
		this.gameUI.ControlTooltips.GamepadTemplate.Destroy();
		this.gameUI.ControlTooltips.KeyboardTemplate.Destroy();

		// Init events
		Signals.INPUT_TYPE_CHANGED_EVENT.Connect((platform) => this.inputTypeChanged(platform));
		Signals.TOOL.EQUIPPED.Connect((tool) => {
			this.currentTool = tool;
			this.updateControlTooltips();
		});
		Signals.TOOL.UNEQUIPPED.Connect(() => {
			this.currentTool = undefined;
			this.updateControlTooltips();
		});

		// Simple tooltips
		this.addSimpleWidget({
			isEnabled: (inputType: typeof InputController.inputType) => inputType === "Gamepad",
			gui: this.gameUI.ToolbarGui.GamepadBack,
			updateFunc: (inputType, element) => {
				TooltipController.updateGamepadWidgetImage(element.gui as ImageLabel, Enum.KeyCode.ButtonL1);
				this.defaultTween(inputType, element);
			},
		});
		this.addSimpleWidget({
			isEnabled: (inputType) => inputType === "Gamepad",
			gui: this.gameUI.ToolbarGui.GamepadNext,
			updateFunc: (inputType, element) => {
				TooltipController.updateGamepadWidgetImage(element.gui as ImageLabel, Enum.KeyCode.ButtonR1);
				this.defaultTween(inputType, element);
			},
		});

		// Finish
		this.gameUI.ControlTooltips.Visible = true;
		this.inputTypeChanged(InputController.inputType);
	}

	private static updateControlTooltips() {
		// Clear all buttons
		this.tooltips.forEach((element) => {
			element.Destroy();
		});

		// Create new
		if (this.currentTool === undefined) {
			return;
		}

		if (InputController.inputType === "Desktop") {
			this.currentTool.getKeyboardTooltips().forEach((element) => {
				const button = this.keyboardTooltipTemplate.Clone();

				button.TextLabel.Text = element.text;
				button.ImageLabel.KeyLabel.Text = element.key;
				button.Parent = this.gameUI.ControlTooltips;

				this.tooltips.push(button);
			});
		} else if (InputController.inputType === "Gamepad") {
			this.currentTool.getGamepadTooltips().forEach((element) => {
				const button = this.gamepadTooltipTemplate.Clone();

				button.TextLabel.Text = element.text;
				button.ImageLabel.Image = element.image;
				button.Parent = this.gameUI.ControlTooltips;

				this.tooltips.push(button);
			});
		}

		GuiAnimator.transition(this.gameUI.ControlTooltips, 0.2, "up");
	}

	public static updateGamepadWidgetImage(imageLabel: ImageLabel, key: Enum.KeyCode) {
		imageLabel.Image = UserInputService.GetImageForKeyCode(key);
	}
	public static defaultTween(inputType: typeof InputController.inputType, element: SimpleTooltip) {
		if (element.isEnabled(inputType)) {
			GuiAnimator.tweenTransparency(element.gui, 0, 0.2);
			GuiAnimator.transition(element.gui, 0.2, "up");
		} else {
			GuiAnimator.tweenTransparency(element.gui, 1, 0.2);
		}
	}

	// Simple tooltips
	public static addSimpleWidget(tooltip: SimpleTooltip) {
		TooltipController.simpleTooltips.push(tooltip);
	}

	private static inputTypeChanged(inputType: typeof InputController.inputType) {
		this.simpleTooltips.forEach((element) => {
			if (element.updateFunc) element.updateFunc(inputType, element);
			else this.defaultTween(inputType, element);
		});

		this.updateControlTooltips();
	}
}
