import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import BlockConfigDefinitionRegistry, {
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
	BlockConfigRegToDefinition,
} from "shared/BlockConfigDefinitionRegistry";
import Objects from "shared/_fixes_/objects";
import CheckBoxControl, { CheckBoxControlDefinition } from "../../controls/CheckBoxControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "../../controls/KeyChooserControl";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "../../controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "../../controls/SliderControl";

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
		// control.value.set(definition.config);

		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire({ ...config, keyUp: value, keyDown: value }),
		);
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
	thrust: () => ConfigPartDefinition<GuiObject>;
};
export type ConfigControlDefinition = ScrollingFrame & {
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	ThrustTemplate: ConfigPartDefinition<GuiObject>;
};

export default class ConfigControl extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(key: string, value: BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]["config"]) => void
	>();

	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;
	private readonly numberTemplate;
	private readonly thrustTemplate;

	constructor(gui: ConfigControlDefinition) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.CheckboxTemplate);
		this.keyTemplate = Control.asTemplate(this.gui.KeyTemplate);
		this.sliderTemplate = Control.asTemplate(this.gui.SliderTemplate);
		this.numberTemplate = Control.asTemplate(this.gui.NumberTemplate);
		this.thrustTemplate = Control.asTemplate(this.gui.ThrustTemplate);
	}

	set<TDef extends BlockConfigDefinitions>(config: BlockConfigDefinitionsToConfig<TDef>, definition: TDef) {
		this.clear();

		for (const [id, def] of Objects.entries(definition)) {
			const control = new configControls[def.type](
				{
					checkbox: this.checkboxTemplate,
					key: this.keyTemplate,
					number: this.numberTemplate,
					slider: this.sliderTemplate,
					thrust: this.thrustTemplate,
				},
				config[id] as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value));
		}
	}
}
