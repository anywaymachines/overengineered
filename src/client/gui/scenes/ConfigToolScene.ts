import { serializeOne } from "client/Config";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Control from "client/base/Control";
import logicRegistry from "client/blocks/LogicRegistry";
import ConfigTool from "client/tools/ConfigTool";
import { blockRegistry } from "shared/BlockRegistry";
import { ConfigValue, ConfigValueTypes, KeyCode } from "shared/Configuration";
import Objects from "shared/Objects";
import Remotes from "shared/Remotes";
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
	};
	ApplyToAllButton: TextButton;
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
			this.gui.ApplyToAllButton.Visible = inputType !== "Gamepad";
			this.gui.DeselectAllButton.Visible = inputType !== "Gamepad";
		}, true);
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.ApplyToAllButton, 0.2, "down");
		GuiAnimator.transition(this.gui.DeselectAllButton, 0.22, "down");
	}

	private updateConfigs(selected: readonly SelectionBox[]) {
		this.list.clear();
		if (selected.size() === 0) return;

		const blockmodel = selected[0].Parent as Model;
		const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;

		// TODO: redo logic-config stuff
		const logicctor = logicRegistry[block.id];
		if (!logicctor) return;

		const logic = new logicctor(blockmodel) as ConfigurableBlockLogic<ConfigValueTypes>;
		if (!("getConfigDefinition" in logic)) return;

		const defs = logic.getConfigDefinition();
		const config = logic.config;

		const send = (key: string, value: ConfigValue) => {
			print("sending " + key + " " + serializeOne(value, defs[key]));

			return Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
					block: blockmodel,
					data: { key, value: serializeOne(value, defs[key]) },
				});
		};

		for (const [id, def] of Objects.entries(defs)) {
			if (def.type === "bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new CheckBoxControl(cb),
					config,
					def,
					id,
					false as boolean,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			} else if (def.type === "key") {
				const control = new ConfigPartControl(
					this.keyTemplate(),
					(kb) => new KeyChooserControl(kb),
					config,
					def,
					id,
					"P" as KeyCode,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			} else if (def.type === "number") {
				const control = new ConfigPartControl(
					this.sliderTemplate(),
					(cb) => new SliderControl(cb, def.min, def.max, def.step),
					config,
					def,
					id,
					0,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			}
		}
	}
}
