import { StarterGui, UserInputService } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import SoundController from "client/controller/SoundController";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import ToolBase from "client/tools/ToolBase";
import ToolController from "client/tools/ToolController";
import { TransformProps } from "shared/component/Transform";

export type ToolbarButtonControlDefinition = TextButton & {
	readonly ImageLabel: ImageLabel;
	readonly KeyboardNumberLabel: TextLabel;
};

export class ToolbarButtonControl extends Control<ToolbarButtonControlDefinition> {
	// Colors
	private readonly activeColor = Colors.accent;
	private readonly inactiveColor = Colors.staticBackground;
	private readonly activeImageColor = Colors.black;
	private readonly inactiveImageColor = Colors.accentLight;

	constructor(gui: ToolbarButtonControlDefinition, tools: ToolController, tool: ToolBase, index: number) {
		super(gui);

		this.gui.Name = tool.getDisplayName();
		this.gui.ImageLabel.Image = tool.getImageID();
		this.gui.KeyboardNumberLabel.Text = tostring(index);

		this.event.subscribe(this.gui.Activated, () => {
			if (LoadingController.isLoading.get()) return;
			tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool);
		});
		this.event.subscribeObservable(
			tools.selectedTool,
			(newtool) => {
				// Update GUI
				if (newtool === tool) {
					GuiAnimator.tweenColor(this.gui, this.activeColor, 0.2);
					GuiAnimator.tween(
						this.gui.ImageLabel,
						{ ImageColor3: this.activeImageColor },
						new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);
				} else {
					GuiAnimator.tweenColor(this.gui, this.inactiveColor, 0.2);
					GuiAnimator.tween(
						this.gui.ImageLabel,
						{ ImageColor3: this.inactiveImageColor },
						new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);
				}
			},
			true,
		);
	}
}

export type ToolbarControlDefinition = GuiObject & {
	readonly Buttons: GuiObject & {
		readonly Template: ToolbarButtonControlDefinition;
	};
	readonly Info: {
		readonly NameLabel: TextLabel;
		readonly GamepadBack: ImageLabel;
		readonly GamepadNext: ImageLabel;
	};
};

export default class ToolbarControl extends Control<ToolbarControlDefinition> {
	private readonly tools;
	private readonly nameLabel;

	constructor(tools: ToolController, gui: ToolbarControlDefinition) {
		super(gui);
		this.tools = tools;

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		const template = this.asTemplate(this.gui.Buttons.Template);
		const toolButtons = new DictionaryControl<GuiObject, ToolBase, ToolbarButtonControl>(this.gui.Buttons);
		this.add(toolButtons);

		this.nameLabel = this.add(new Control(this.gui.Info.NameLabel));

		this.event.subscribeObservable2(
			tools.tools,
			(toollist) => {
				toolButtons.clear();

				let index = 0;
				for (const tool of toollist) {
					const button = new ToolbarButtonControl(template(), tools, tool, ++index);
					toolButtons.keyedChildren.add(tool, button);
				}
			},
			true,
		);
		this.event.subscribeObservable2(
			tools.disabledTools,
			(disabled) => {
				for (const [tool, control] of toolButtons.keyedChildren.getAll()) {
					const isdisabled = disabled.includes(tool);

					control.instance.BackgroundTransparency = isdisabled ? 0.8 : 0.2;
					control.instance.Active = !isdisabled;
					control.instance.Interactable = !isdisabled;
					control.instance.AutoButtonColor = !isdisabled;
				}
			},
			true,
		);

		this.event.onPrepare((inputType) => {
			const tween = (element: GuiObject, enabled: boolean) => {
				if (enabled) {
					GuiAnimator.tweenTransparency(element, 0, 0.2);
					GuiAnimator.transition(element, 0.2, "up");
				} else {
					GuiAnimator.tweenTransparency(element, 1, 0.2);
				}
			};

			for (const button of toolButtons.getChildren()) {
				tween(button.instance.KeyboardNumberLabel, inputType === "Desktop");
			}

			tween(this.gui.Info.GamepadBack, inputType === "Gamepad");
			tween(this.gui.Info.GamepadNext, inputType === "Gamepad");
		});

		this.event.onPrepareGamepad(() => {
			this.gui.Info.GamepadBack.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonL1);
			this.gui.Info.GamepadNext.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonR1);
		});

		this.event.subscribeObservable(tools.selectedTool, (tool, prev) => this.toolChanged(tool, prev));
		this.resetLabels();
	}

	show(): void {
		super.show();
		return;

		const params: TransformProps = {
			style: "Quad",
			direction: "Out",
			duration: 0.3,
		};
		this.transform((tr) => tr.transform("AnchorPoint", new Vector2(0, 1), params));
	}
	hide(): void {
		super.hide();
		return;

		const params: TransformProps = {
			style: "Quad",
			direction: "Out",
			duration: 0.3,
		};
		this.transform((tr) =>
			tr
				.transform("AnchorPoint", new Vector2(0, 0), params)
				.then()
				.func(() => super.hide()),
		);
	}

	private toolChanged(tool: ToolBase | undefined, prev: ToolBase | undefined) {
		const duration = tool && prev ? 0.07 : 0.15;

		this.nameLabel.transform((transform) => {
			if (prev) {
				transform
					.moveY(new UDim(0, 0), { duration })
					.transform("TextTransparency", 1, { duration: duration * 0.8 });
			}

			transform.then().func(() => (this.instance.Info.NameLabel.Text = tool?.getDisplayName() ?? ""));

			if (tool) {
				transform
					.then()
					.moveY(new UDim(1, 0))
					.transform("TextTransparency", 1)
					.moveY(new UDim(0.5, 0), { duration })
					.transform("TextTransparency", 0, { duration: duration * 0.8 })
					.then();
			}
		});

		// Play sound
		SoundController.getSounds().Click.Play();
	}

	private resetLabels() {
		this.instance.Info.NameLabel.Text = "";
	}
}
