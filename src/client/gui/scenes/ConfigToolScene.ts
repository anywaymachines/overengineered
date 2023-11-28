import CheckBoxControl, { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import ConfigTool from "client/tools/ConfigTool";
import Control from "client/base/Control";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import BlockRegistry from "shared/registry/BlocksRegistry";
import GuiAnimator from "../GuiAnimator";
import { HttpService } from "@rbxts/services";
import Remotes from "shared/Remotes";
import Signals from "client/event/Signals";
import ObservableValue from "shared/event/ObservableValue";
import KeyChooserControl, { KeyChooserControlDefinition } from "../controls/KeyChooserControl";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	HeadingLabel: TextLabel;
	Control: T;
};

export class ConfigPartControl<
	TControl extends Control<TDef>,
	TDef extends GuiObject,
	TValue extends ConfigValues | undefined,
> extends Control<ConfigPartDefinition<TDef>> {
	public readonly control;

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { value: ObservableValue<TValue> },
		config: Record<string, ConfigValues | undefined>,
		definition: ConfigDefinition,
		def: TValue,
	) {
		super(gui);

		this.control = ctor(this.gui.Control);
		this.control.value.set(
			(config[definition.id] as TValue) ?? (definition.default[Signals.INPUT_TYPE.get()] as TValue) ?? def,
		);

		this.add(this.control);
	}
}

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
		this.add(this.list, false);

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
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

	private updateConfigs(selected: readonly Highlight[]) {
		function isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
			return "getConfigDefinitions" in block;
		}

		this.list.clear();
		if (selected.size() === 0) return;

		const item = selected[0].Parent as Model;
		const block = BlockRegistry.getBlockByID(item.GetAttribute("id") as string)!;

		if (!isConfigurableBlock(block)) return;

		const defs = block.getConfigDefinitions();
		const config = HttpService.JSONDecode((item.GetAttribute("config") as string | undefined) ?? "{}") as Record<
			string,
			ConfigValues
		>;

		const send = (key: string, value: unknown) => {
			print("send " + key + " to " + value);

			return Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({ block: item, data: { key, value } });
		};

		for (const def of defs) {
			if (def.type === "Bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new CheckBoxControl(cb),
					config,
					def,
					false,
				);
				this.list.add(control);

				control.control.value.subscribe((value) => send(def.id, value));
			} else if (def.type === "Key") {
				const control = new ConfigPartControl(
					this.keyTemplate(),
					(kb) => new KeyChooserControl(kb),
					config,
					def,
					undefined,
				);
				this.list.add(control);

				control.control.value.subscribe((value) => send(def.id, value));
			} else if (def.type === "Number") {
				const control = new ConfigPartControl(
					this.sliderTemplate(),
					(cb) => new SliderControl(cb, def.min, def.max, def.step),
					config,
					def,
					0,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			}
		}
	}
}
