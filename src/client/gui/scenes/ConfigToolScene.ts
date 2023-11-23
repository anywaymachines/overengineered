import Scene from "client/base/Scene";
import CheckBoxControl, { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import ConfigTool from "client/tools/ConfigTool";
import Control from "client/base/Control";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import { ListControl } from "../controls/ListControl";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	HeadingLabel: TextLabel;
	Control: T;
};

export class ConfigPartControl<TControl extends Control<TDef>, TDef extends GuiObject> extends Control<
	ConfigPartDefinition<TDef>
> {
	public readonly control;

	constructor(gui: ConfigPartDefinition<TDef>, ctor: (gui: TDef) => TControl) {
		super(gui);
		this.add((this.control = ctor(this.gui.Control)));
	}
}

export type ConfigToolSceneDefinition = GuiObject & {
	ParamsSelection: Frame & {
		Buttons: ScrollingFrame & {
			CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
			KeyTemplate: Frame & {
				Control: Frame; // TODO:
			};
			SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
		};
	};
	SelectSimilarButton: TextButton;
	ClearSelectionButton: TextButton;
};

export default class ConfigToolScene extends Scene<ConfigToolSceneDefinition> {
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;

	private readonly list;

	constructor(gui: ConfigToolSceneDefinition, tool: ConfigTool) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.CheckboxTemplate);
		this.keyTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.KeyTemplate);
		this.sliderTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.SliderTemplate);

		this.list = new ListControl(this.gui.ParamsSelection.Buttons);
		this.add(this.list, false);

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
		});
	}

	private updateConfigs(selected: readonly Highlight[]) {
		function isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
			return "getConfigDefinitions" in block;
		}

		if (selected.size() === 0) return;

		const item = selected[0].Parent as Model;
		const block = BlockRegistry.getBlockByID(item.GetAttribute("id") as string)!;

		if (!isConfigurableBlock(block)) return;

		const defs = block.getConfigDefinitions();
		for (const config of defs) {
			if (config.type === "Bool") {
				const control = new ConfigPartControl(this.checkboxTemplate(), (cb) => new CheckBoxControl(cb));
				this.list.add(control);
			} else if (config.type === "Key") {
				// const control = this.keyTemplate();
				// this.list.add(control)
			} else if (config.type === "Number") {
				const control = new ConfigPartControl(this.sliderTemplate(), (cb) => new SliderControl(cb));
				this.list.add(control);
			}
		}
	}
}
