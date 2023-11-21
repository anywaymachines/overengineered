import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import Signals from "client/event/Signals";
import GuiAnimator from "client/gui/GuiAnimator";
import CheckBoxControl from "client/gui/controls/CheckBoxControl";
import SliderControl from "client/gui/controls/SliderControl";
import ConfigTool from "client/tools/ConfigTool";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import ToolWidget from "./ToolWidget";

type ConfigToolGui = Frame & {
	Selection: Frame & {
		Buttons: ScrollingFrame & {
			CheckboxTemplate: Frame & {
				CheckBoxControl: CheckBoxControl;
			};
			KeyTemplate: Frame & {
				KeyEditorWidget: Frame; // TODO:
			};
			SeekbarTemplate: Frame & {
				SliderControl: SliderControl;
			};
		};
	};
	SelectSimilarButton: TextButton;
	ClearSelectionButton: TextButton;
};

export default class ConfigToolWidget extends ToolWidget<ConfigTool> {
	private readonly gui: ConfigToolGui;
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;

	constructor(tool: ConfigTool) {
		super(tool);

		this.gui = this.getGui();

		this.checkboxTemplate = this.gui.Selection.Buttons.CheckboxTemplate;
		this.keyTemplate = this.gui.Selection.Buttons.KeyTemplate;
		this.sliderTemplate = this.gui.Selection.Buttons.SeekbarTemplate;

		this.checkboxTemplate.Visible = this.keyTemplate.Visible = this.sliderTemplate.Visible = false;

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
		});
	}

	private updateConfigs(selected: readonly Highlight[]) {
		function isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
			return "getConfigDefinitions" in block;
		}

		for (const item of this.gui.Selection.Buttons.GetChildren()) {
			if (item === this.checkboxTemplate) continue;
			if (item === this.keyTemplate) continue;
			if (item === this.sliderTemplate) continue;

			item.Destroy();
		}

		if (selected.size() === 0) return;

		const item = selected[0].Parent as Model;
		const block = BlockRegistry.getBlockByID(item.GetAttribute("id") as string)!;

		if (isConfigurableBlock(block)) {
			const defs = block.getConfigDefinitions();
			for (const config of defs) {
				if (config.type === "Bool") {
					const control = this.checkboxTemplate.Clone();
					control.Visible = true;
					control.Parent = this.gui.Selection.Buttons;
				} else if (config.type === "Key") {
					const control = this.keyTemplate.Clone();
					control.Visible = true;
					control.Parent = this.gui.Selection.Buttons;
				} else if (config.type === "Number") {
					const control = this.sliderTemplate.Clone();
					control.Visible = true;
					control.Parent = this.gui.Selection.Buttons;
				}
			}
		}
	}

	showWidget(hasAnimations: boolean): void {
		super.showWidget(hasAnimations);

		this.gui.Visible = true;
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	private getGui() {
		const gameui = GuiController.getGameUI();
		if (!(this.gui !== undefined && this.gui.Parent !== undefined) && "ConfigToolGui" in gameui) {
			return gameui.ConfigToolGui as ConfigToolGui;
		}

		return this.gui;
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}

	protected prepare() {
		super.prepare();

		// Show by default
		this.gui.SelectSimilarButton.Visible = true;
		this.gui.ClearSelectionButton.Visible = true;

		GuiAnimator.transition(this.gui.Selection, 0.2, "right");
		GuiAnimator.transition(this.gui.SelectSimilarButton, 0.2, "down");
		GuiAnimator.transition(this.gui.ClearSelectionButton, 0.22, "down");
	}

	protected prepareDesktop(): void {
		// Empty
	}

	protected prepareTouch(): void {
		// Empty
	}

	protected prepareGamepad(): void {
		// Use this as buttons on gamepad
		this.gui.SelectSimilarButton.Visible = false;
		this.gui.ClearSelectionButton.Visible = false;
	}
}
