import { StarterGui, UserInputService } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { SoundController } from "client/controller/SoundController";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { ToolBase } from "client/tools/ToolBase";
import { ToolController } from "client/tools/ToolController";
import { TransformService } from "shared/component/TransformService";

export type ToolbarButtonControlDefinition = TextButton & {
	readonly ImageLabel: ImageLabel;
	readonly KeyboardNumberLabel: TextLabel;
};

export class ToolbarButtonControl extends Control<ToolbarButtonControlDefinition> {
	constructor(gui: ToolbarButtonControlDefinition, tools: ToolController, tool: ToolBase, index: number) {
		super(gui);

		this.gui.Name = tool.getDisplayName();
		this.gui.ImageLabel.Image = tool.getImageID();
		this.gui.KeyboardNumberLabel.Text = tostring(index);

		this.event.subscribe(this.gui.Activated, () => {
			if (LoadingController.isLoading.get()) return;
			tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool);
		});

		const selectedToolStateMachine = TransformService.multi(
			TransformService.boolStateMachine(
				this.gui,
				TransformService.commonProps.quadOut02,
				{ BackgroundColor3: Colors.accent },
				{ BackgroundColor3: Colors.staticBackground },
			),
			TransformService.boolStateMachine(
				this.gui.ImageLabel,
				TransformService.commonProps.quadOut02,
				{ ImageColor3: Colors.black },
				{ ImageColor3: Colors.accentLight },
			),
			TransformService.boolStateMachine(
				this.gui.KeyboardNumberLabel,
				TransformService.commonProps.quadOut02,
				{ TextColor3: Colors.staticBackground, TextTransparency: 0.4 },
				{ TextColor3: Colors.accentLight, TextTransparency: 0 },
			),
		);
		this.event.subscribeObservable(
			tools.selectedTool,
			(newtool) => selectedToolStateMachine(newtool === tool),
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

export class ToolbarControl extends Control<ToolbarControlDefinition> {
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

		this.event.subscribeObservable(
			tools.visibleTools.enabled,
			(visible) => {
				toolButtons.clear();

				let index = 0;
				for (const tool of tools.allToolsOrdered) {
					if (!visible.includes(tool)) {
						continue;
					}

					const button = new ToolbarButtonControl(template(), tools, tool, ++index);
					toolButtons.keyedChildren.add(tool, button);
				}
			},
			true,
		);
		this.event.subscribeObservable(
			tools.enabledTools.enabled,
			(enabled) => {
				for (const [tool, control] of toolButtons.keyedChildren.getAll()) {
					const isenabled = enabled.includes(tool);

					control.instance.BackgroundTransparency = isenabled ? 0.2 : 0.8;
					control.instance.Active = isenabled;
					control.instance.Interactable = isenabled;
					control.instance.AutoButtonColor = isenabled;
				}
			},
			true,
		);

		this.event.onPrepare((inputType) => {
			for (const button of toolButtons.getChildren()) {
				button.instance.KeyboardNumberLabel.Visible = inputType === "Desktop";
			}

			this.gui.Info.GamepadBack.Visible = inputType === "Gamepad";
			this.gui.Info.GamepadNext.Visible = inputType === "Gamepad";
		});

		this.event.onPrepareGamepad(() => {
			this.gui.Info.GamepadBack.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonL1);
			this.gui.Info.GamepadNext.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonR1);
		});

		this.event.subscribeObservable(tools.selectedTool, (tool, prev) => this.toolChanged(tool, prev));
		this.resetLabels();
	}

	private readonly visibilityFunction = TransformService.boolStateMachine(
		this.gui,
		TransformService.commonProps.quadOut02,
		{ AnchorPoint: new Vector2(0, 1) },
		{ AnchorPoint: new Vector2(0, 0) },
		(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
		(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
	);
	protected setInstanceVisibilityFunction(visible: boolean): void {
		this.visibilityFunction(visible);
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
