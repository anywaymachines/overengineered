import { HttpService } from "@rbxts/services";
import Config from "client/Config";
import Control from "client/base/Control";
import { InputBlockConfig } from "client/blocks/config/BlockConfigWithLogic";
import ConfigTool from "client/tools/ConfigTool";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import GuiAnimator from "../../GuiAnimator";
import CheckBoxControl, { CheckBoxControlDefinition } from "../../controls/CheckBoxControl";
import ConfigPartControl from "../../controls/ConfigPartControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "../../controls/KeyChooserControl";
import SliderControl, { SliderControlDefinition } from "../../controls/SliderControl";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	HeadingLabel: TextLabel;
	Control: T;
};

export type ConfigToolSceneDefinition = GuiObject & {
	ParamsSelection: Frame & {
		Buttons: ScrollingFrame & {
			CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
			KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
			SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
		};
		Title: GuiObject & {
			HeadingLabel: TextLabel;
		};
	};
	DeselectAllButton: TextButton;
};

export default class ConfigToolScene extends Control<ConfigToolSceneDefinition> {
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;

	private readonly list;

	constructor(gui: ConfigToolSceneDefinition, tool: ConfigTool) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.CheckboxTemplate);
		this.keyTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.KeyTemplate);
		this.sliderTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.SliderTemplate);

		this.list = new Control(this.gui.ParamsSelection.Buttons);
		this.add(this.list);

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
		});

		this.gui.DeselectAllButton.Activated.Connect(() => {
			tool.unselectAll();
		});

		this.event.onPrepare((inputType) => {
			this.gui.DeselectAllButton.Visible = inputType !== "Gamepad";
		}, true);
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.DeselectAllButton, 0.22, "down");

		this.updateConfigs([]);
	}

	private updateConfigs(selected: readonly (SelectionBox & { Parent: BlockModel })[]) {
		this.list.clear();
		if (selected.size() === 0) return;

		this.gui.ParamsSelection.Title.HeadingLabel.Text = `CONFIGURATION (${selected.size()})`;

		const configs = selected
			.map((selected) => {
				const blockmodel = selected.Parent;
				const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
					.input as ConfigDefinitions;
				if (!defs) return undefined!;

				{
					const configAttribute = blockmodel.GetAttribute("config") as string | undefined;
					const content =
						configAttribute !== undefined
							? (HttpService.JSONDecode(configAttribute) as
									| Readonly<Record<keyof ConfigDefinitions, string>>
									| undefined)
							: undefined;
					const config = content === undefined ? {} : Config.deserialize(content, defs);

					return [blockmodel, new InputBlockConfig(config, defs)] as const;
				}

				//return new BlockConfig(blockmodel, defs);
			})
			.filter((x) => x !== undefined);

		const blockmodel = selected[0].Parent;
		const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;
		const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry].input as ConfigDefinitions;

		const send = async (key: string, value: ConfigValue) => {
			Logger.info(
				`Sending (${configs.size()}) block config values ${key} ${Config.serializeOne(value, onedef[key])}`,
			);

			await Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
					blocks: configs.map((config) => config[0]),
					data: { key, value: Config.serializeOne(value, onedef[key]) },
				});
		};

		for (const [id, def] of Objects.entries(onedef)) {
			if (def.type === "bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new CheckBoxControl(cb),
					configs.map((c) => c[1]),
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(id, value));
			} else if (def.type === "key") {
				const control = new ConfigPartControl(
					this.keyTemplate(),
					(kb) => new KeyChooserControl(kb),
					configs.map((c) => c[1]),
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(id, value));
			} else if (def.type === "number") {
				const control = new ConfigPartControl(
					this.sliderTemplate(),
					(cb) => new SliderControl(cb, def.min, def.max, def.step),
					configs.map((c) => c[1]),
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(id, value));
			}
		}
	}
}
