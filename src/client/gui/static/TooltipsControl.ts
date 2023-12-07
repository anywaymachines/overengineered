import { UserInputService } from "@rbxts/services";
import Control from "client/base/Control";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import GuiAnimator from "../GuiAnimator";

export type SimpleTooltip = {
	isEnabled: (inputType: InputType) => boolean;
	gui: GuiObject;
	updateFunc?: (inputType: InputType, info: SimpleTooltip) => void;
};

export type TooltipsControlDefinition = GuiObject & {
	GamepadTemplate: GuiObject & {
		ImageLabel: ImageLabel;
		TextLabel: TextLabel;
	};
	KeyboardTemplate: GuiObject & {
		TextLabel: TextLabel;
		Keys: GuiObject & {
			ImageLabel: ImageLabel & {
				KeyLabel: TextLabel;
			};
		};
	};
};

export default class TooltipsControl extends Control<
	TooltipsControlDefinition,
	Control<TooltipsControlDefinition["GamepadTemplate"] | TooltipsControlDefinition["KeyboardTemplate"]>
> {
	public static readonly instance = new TooltipsControl(
		GuiController.getGameUI<{
			Static: {
				ControlTooltips: TooltipsControlDefinition;
			};
		}>().Static.ControlTooltips,
	);

	private readonly gamepadTooltipTemplate;
	private readonly keyboardTooltipTemplate;

	private readonly simpleTooltips: SimpleTooltip[] = [];

	constructor(gui: TooltipsControlDefinition) {
		super(gui);

		this.keyboardTooltipTemplate = Control.asTemplate(this.gui.KeyboardTemplate);
		this.gamepadTooltipTemplate = Control.asTemplate(this.gui.GamepadTemplate);

		this.event.onPrepare((inputType) => {
			this.simpleTooltips.forEach((element) => this.processTooltip(element, inputType));
		});
	}

	public updateControlTooltips(tool: ToolBase | undefined) {
		this.clear();
		if (!tool) return;

		if (InputController.inputType.get() === "Desktop") {
			tool.getKeyboardTooltips().forEach((element) => {
				const button = this.keyboardTooltipTemplate();
				this.add(new Control(button));

				button.TextLabel.Text = element.text;

				for (let i = 0; i < element.keys.size(); i++) {
					let key;

					if (i === 0) key = button.Keys.ImageLabel;
					else {
						key = button.Keys.ImageLabel.Clone();
						key.Parent = button.Keys;
					}

					key.KeyLabel.Text = element.keys[i];
				}
			});
		} else if (InputController.inputType.get() === "Gamepad") {
			tool.getGamepadTooltips().forEach((element) => {
				const button = this.gamepadTooltipTemplate();
				this.add(new Control(button));

				button.TextLabel.Text = element.text;
				button.ImageLabel.Image = UserInputService.GetImageForKeyCode(element.key);
			});
		}

		GuiAnimator.transition(this.gui, 0.2, "up");
	}

	private processTooltip(tooltip: SimpleTooltip, inputType: InputType) {
		if (tooltip.updateFunc) tooltip.updateFunc(inputType, tooltip);
		else this.defaultTween(inputType, tooltip);
	}

	private defaultTween(inputType: InputType, element: SimpleTooltip) {
		if (element.isEnabled(inputType)) {
			GuiAnimator.tweenTransparency(element.gui, 0, 0.2);
			GuiAnimator.transition(element.gui, 0.2, "up");
		} else {
			GuiAnimator.tweenTransparency(element.gui, 1, 0.2);
		}
	}

	// Simple tooltips
	public addSimpleTooltip(tooltip: SimpleTooltip) {
		this.simpleTooltips.push(tooltip);
		this.processTooltip(tooltip, InputController.inputType.get());
	}
}
