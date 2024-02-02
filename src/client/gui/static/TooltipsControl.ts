import { UserInputService } from "@rbxts/services";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import ToolBase from "client/tools/ToolBase";
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

	constructor(gui: TooltipsControlDefinition) {
		super(gui);

		this.keyboardTooltipTemplate = Control.asTemplate(this.gui.KeyboardTemplate);
		this.gamepadTooltipTemplate = Control.asTemplate(this.gui.GamepadTemplate);
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
}
