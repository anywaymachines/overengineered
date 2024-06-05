import { UserInputService } from "@rbxts/services";
import { ClientInstanceComponent } from "client/component/ClientInstanceComponent";
import { InputController } from "client/controller/InputController";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { TransformService } from "shared/component/TransformService";
import { Element } from "shared/Element";
import type { InstanceComponent } from "shared/component/InstanceComponent";

const tooltipsGui = Gui.getGameUI<{ ControlsInfo: TooltipsControlDefinition }>().ControlsInfo;
tooltipsGui.Visible = true;

const keyboardTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.KeyboardTemplate);
const gamepadTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.GamepadTemplate);

export type Tooltip = { readonly keys: readonly KeyCode[]; readonly text: string };
export type Tooltips = readonly Tooltip[];
export interface InputTooltips {
	readonly Desktop?: Tooltips;
	readonly Gamepad?: Tooltips;
}

type TooltipsControlDefinition = GuiObject & {
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

export class TooltipsHolder extends ClientInstanceComponent<
	GuiObject,
	InstanceComponent<typeof tooltipsGui.KeyboardTemplate>
> {
	static createComponent(category: string): TooltipsHolder {
		const gui = Element.create(
			"Frame",
			{
				Size: new UDim2(1, 0, 0, 0),
				AutomaticSize: Enum.AutomaticSize.Y,
				BackgroundTransparency: 1,
				Name: category,
				Parent: tooltipsGui,
			},
			{
				list: Element.create("UIListLayout", {
					FillDirection: Enum.FillDirection.Vertical,
					SortOrder: Enum.SortOrder.LayoutOrder,
					VerticalAlignment: Enum.VerticalAlignment.Bottom,
				}),
			},
		);

		return new TooltipsHolder(gui);
	}

	private readonly instances: GuiObject[] = [];
	private tooltips: InputTooltips = {};
	constructor(instance: GuiObject) {
		super(instance);
		this.onPrepare(() => this.set(this.tooltips));
		this.onDisable(() => this.justSet({}));
	}

	private createTooltip(tooltip: Tooltip) {
		const button = keyboardTooltipTemplate();
		button.TextLabel.Text = tooltip.text;

		for (let i = 0; i < tooltip.keys.size(); i++) {
			let key;

			if (i === 0) key = button.Keys.ImageLabel;
			else {
				key = button.Keys.ImageLabel.Clone();
				key.Parent = button.Keys;
			}

			const sub = (key: KeyCode): string => {
				if (key === "Zero") return "0";
				if (key === "One") return "1";
				if (key === "Two") return "2";
				if (key === "Three") return "3";
				if (key === "Four") return "4";
				if (key === "Five") return "5";
				if (key === "Six") return "6";
				if (key === "Seven") return "7";
				if (key === "Eight") return "8";
				if (key === "Nine") return "9";

				if (key === "KeypadZero") return "k0";
				if (key === "KeypadOne") return "k1";
				if (key === "KeypadTwo") return "k2";
				if (key === "KeypadThree") return "k3";
				if (key === "KeypadFour") return "k4";
				if (key === "KeypadFive") return "k5";
				if (key === "KeypadSix") return "k6";
				if (key === "KeypadSeven") return "k7";
				if (key === "KeypadEight") return "k8";
				if (key === "KeypadNine") return "k9";

				return key;
			};

			if (tooltip.keys[i].sub(0, "Button".size()) === "Button") {
				// gamepad button
				key.KeyLabel.Text = "";
				key.Image = UserInputService.GetImageForKeyCode(tooltip.keys[i]);
			} else if (tooltip.keys[i].sub(0, "DPad".size()) === "DPad") {
				// gamepad dpad
				key.KeyLabel.Text = "";
				key.Image = UserInputService.GetImageForKeyCode(tooltip.keys[i]);
			} else {
				key.KeyLabel.Text = sub(tooltip.keys[i]);
			}
		}

		if (this.isEnabled()) {
			TransformService.run(button, (tr) =>
				tr
					.transform("Size", new UDim2(1, 0, 0, 0))
					.then()
					.transform("Size", new UDim2(1, 0, 0, 50), TransformService.commonProps.quadOut02),
			);
		} else {
			button.Visible = false;
		}

		return button;
	}

	private destroyTooltip(tooltip: GuiObject) {
		TransformService.run(tooltip, (tr) => {
			tr.transform("Size", new UDim2(1, 0, 0, 0), TransformService.commonProps.quadOut02)
				.then()
				.func(() => tooltip.Destroy());
		});
	}

	set(tooltips: InputTooltips) {
		this.tooltips = tooltips;
		this.justSet(tooltips);
	}
	private justSet(tooltips: InputTooltips) {
		for (const tooltip of this.instances) {
			this.destroyTooltip(tooltip);
		}
		this.instances.clear();

		const set = (tooltips: Tooltips) => {
			for (const tooltip of tooltips) {
				const instance = this.createTooltip(tooltip);
				instance.Parent = this.instance;
				this.instances.push(instance);
			}
		};

		if (InputController.inputType.get() === "Desktop" && tooltips.Desktop) {
			set(tooltips.Desktop);
		} else if (InputController.inputType.get() === "Gamepad" && tooltips.Gamepad) {
			set(tooltips.Gamepad);
		}
	}

	destroy(): void {
		task.delay(0.2, () => super.destroy());
	}
}
