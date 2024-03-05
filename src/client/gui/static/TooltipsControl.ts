import { UserInputService } from "@rbxts/services";
import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";

export interface TooltipSource {
	getGamepadTooltips(): readonly { readonly key: Enum.KeyCode; readonly text: string }[];
	getKeyboardTooltips(): readonly { readonly keys: string[]; readonly text: string }[];
}
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
	static readonly instance = new TooltipsControl(
		Gui.getGameUI<{
			ControlsInfo: TooltipsControlDefinition;
		}>().ControlsInfo,
	);

	private readonly gamepadTooltipTemplate;
	private readonly keyboardTooltipTemplate;

	constructor(gui: TooltipsControlDefinition) {
		super(gui);

		this.keyboardTooltipTemplate = Control.asTemplate(this.gui.KeyboardTemplate);
		this.gamepadTooltipTemplate = Control.asTemplate(this.gui.GamepadTemplate);
	}

	updateControlTooltips(source: TooltipSource | undefined) {
		this.clear();
		if (!source) return;

		if (InputController.inputType.get() === "Desktop") {
			source.getKeyboardTooltips().forEach((element) => {
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
			source.getGamepadTooltips().forEach((element) => {
				const button = this.gamepadTooltipTemplate();
				this.add(new Control(button));

				button.TextLabel.Text = element.text;
				button.ImageLabel.Image = UserInputService.GetImageForKeyCode(element.key);
			});
		}

		GuiAnimator.transition(this.gui, 0.2, "up");
	}
}
