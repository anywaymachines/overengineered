import Config from "client/Config";
import Control from "client/base/Control";
import BlockConfig from "client/blocks/BlockConfig";
import ConfigTool from "client/tools/ConfigTool";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import GuiAnimator from "../GuiAnimator";
import CheckBoxControl, { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import ConfigPartControl from "../controls/ConfigPartControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "../controls/KeyChooserControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";

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

	private updateConfigs(selected: readonly SelectionBox[]) {
		this.list.clear();
		if (selected.size() === 0) return;

		this.gui.ParamsSelection.Title.HeadingLabel.Text = `CONFIGURATION (${selected.size()})`;

		const configs = selected
			.map((selected) => {
				const blockmodel = selected.Parent as Model;
				const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry] as ConfigDefinitions;
				if (!defs) return undefined! as BlockConfig<ConfigDefinitions>;

				return new BlockConfig(blockmodel, defs);
			})
			.filter((x) => x !== undefined);

		const send = async (
			key: keyof (typeof blockConfigRegistry)[keyof typeof blockConfigRegistry],
			value: ConfigValue,
		) => {
			Logger.info(
				`Sending (${configs.size()}) block config values ${key} ${Config.serializeOne(
					value,
					configs[0].definitions[key],
				)}`,
			);

			await Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
					blocks: configs.map((config) => config.block),
					data: { key, value: Config.serializeOne(value, configs[0].definitions[key]) },
				});
		};

		for (const [id, def] of Objects.entries(configs[0].definitions) as (readonly [
			keyof (typeof blockConfigRegistry)[keyof typeof blockConfigRegistry],
			ConfigDefinition,
		])[]) {
			if (def.type === "bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new CheckBoxControl(cb),
					configs,
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(id, value));
			} else if (def.type === "key") {
				const control = new ConfigPartControl(
					this.keyTemplate(),
					(kb) => new KeyChooserControl(kb),
					configs,
					def,
					id,
				);
				this.list.add(control);

				let prev = control.control.value.get();
				control.control.submitted.Connect((value) => {
					print(`Sending ${id} to ${value}`);
					send(id, value);

					if (def.conflicts !== undefined) {
						const conflict = this.list
							.getChildren()
							.find(
								(c) => c instanceof ConfigPartControl && c.key === def.conflicts,
							) as ConfigPartControl<KeyChooserControl, GuiObject, KeyCode>;

						if (conflict && conflict.control.value.get() === value) {
							print(`Sending conflicted ${conflict.key} to ${prev}`);
							conflict.control.value.set(prev);
							conflict.control.submitted.Fire(prev);
						}
					}

					prev = value;
				});
			} else if (def.type === "number") {
				const control = new ConfigPartControl(
					this.sliderTemplate(),
					(cb) => new SliderControl(cb, def.min, def.max, def.step),
					configs,
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(id, value));
			}
		}
	}
}
