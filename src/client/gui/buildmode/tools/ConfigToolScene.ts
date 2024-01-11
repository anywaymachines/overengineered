import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import ConfigTool from "client/tools/ConfigTool";
import BlockConfig from "shared/BlockConfig";
import BlockConfigDefinitionRegistry, {
	BlockConfigDefinitions,
	BlockConfigRegToDefinition,
} from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import JSON, { JsonSerializablePrimitive } from "shared/_fixes_/Json";
import Objects from "shared/_fixes_/objects";
import GuiAnimator from "../../GuiAnimator";
import CheckBoxControl, { CheckBoxControlDefinition } from "../../controls/CheckBoxControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "../../controls/KeyChooserControl";
import SliderControl, { SliderControlDefinition } from "../../controls/SliderControl";

//

abstract class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}

class BoolConfigValueControl extends ConfigValueControl<CheckBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["bool"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["bool"]>,
	) {
		super(templates.checkbox(), definition.displayName);

		const control = this.added(new CheckBoxControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

class SliderConfigValueControl extends ConfigValueControl<SliderControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["clampedNumber"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["clampedNumber"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["clampedNumber"]>,
	) {
		super(templates.slider(), definition.displayName);

		const control = this.added(
			new SliderControl(this.gui.Control, definition.min, definition.max, definition.step),
		);
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["number"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["number"]>,
	) {
		super(templates.number(), definition.displayName);

		const control = this.added(new NumberTextBoxControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

class KeyBoolConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["keybool"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["keybool"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["keybool"]>,
	) {
		super(templates.key(), definition.displayName);

		const control = this.added(new KeyChooserControl(this.gui.Control));
		control.value.set(config.key);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire({ key: value, switch: false }));
	}
}

class ThrustConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["thrust"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["thrust"]>,
	) {
		super(templates.key(), definition.displayName);

		const control = this.added(new KeyChooserControl(this.gui.Control));
		//control.value.set(config.value);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire({ key: value, switch: false }));
	}
}

class MotorRotationSpeedConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["motorRotationSpeed"]>,
	) {
		super(templates.key(), definition.displayName);

		const control = this.added(new KeyChooserControl(this.gui.Control));
		//control.value.set(config.value);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire({ key: value, switch: false }));
	}
}

const configControls = {
	bool: BoolConfigValueControl,
	keybool: KeyBoolConfigValueControl,
	number: NumberConfigValueControl,
	clampedNumber: SliderConfigValueControl,
	thrust: ThrustConfigValueControl,
	motorRotationSpeed: MotorRotationSpeedConfigValueControl,
} as const satisfies {
	readonly [k in keyof BlockConfigDefinitionRegistry]: {
		new (
			templates: Templates,
			config: BlockConfigDefinitionRegistry[k]["config"],
			definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry[k]>,
		): ConfigValueControl<GuiObject> & {
			submitted: Signal<(value: BlockConfigDefinitionRegistry[k]["config"]) => void>;
		};
	};
};

//

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	HeadingLabel: TextLabel;
	Control: T;
};

type Templates = {
	checkbox: () => ConfigPartDefinition<CheckBoxControlDefinition>;
	key: () => ConfigPartDefinition<KeyChooserControlDefinition>;
	slider: () => ConfigPartDefinition<SliderControlDefinition>;
	number: () => ConfigPartDefinition<NumberTextBoxControlDefinition>;
};
export type ConfigToolSceneDefinition = GuiObject & {
	ParamsSelection: Frame & {
		Buttons: ScrollingFrame & {
			CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
			KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
			SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
			NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
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
	private readonly numberTemplate;

	private readonly list;

	constructor(gui: ConfigToolSceneDefinition, tool: ConfigTool) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.CheckboxTemplate);
		this.keyTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.KeyTemplate);
		this.sliderTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.SliderTemplate);
		this.numberTemplate = Control.asTemplate(this.gui.ParamsSelection.Buttons.NumberTemplate);

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
					.input as BlockConfigDefinitions;
				if (!defs) return undefined!;

				const jsonstr = (blockmodel.GetAttribute("config") as string | undefined) ?? "{}";
				const config = BlockConfig.addDefaults(
					JSON.deserialize<Record<string, JsonSerializablePrimitive>>(jsonstr),
					defs,
				);

				return [blockmodel, config] as const;
			})
			.filter((x) => x !== undefined);

		const blockmodel = selected[0].Parent;
		const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;
		const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
			.input as BlockConfigDefinitions;

		const send = async (
			key: string,
			value: BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]["config"],
		) => {
			Logger.info(`Sending (${configs.size()}) block config values ${key} ${JSON.serialize(value)}`);

			await Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
					blocks: configs.map((config) => config[0]),
					data: { key, value: JSON.serialize(value) },
				});
		};

		for (const [id, def] of Objects.entries(onedef)) {
			const control = new configControls[def.type](
				{
					checkbox: this.checkboxTemplate,
					key: this.keyTemplate,
					number: this.numberTemplate,
					slider: this.sliderTemplate,
				},
				configs[0][1][id] as never,
				def as never,
			);
			this.list.add(control);

			control.submitted.Connect((value) => send(id, value));
		}
	}
}
