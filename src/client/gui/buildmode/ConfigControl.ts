import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import CheckBoxControl, { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "client/gui/controls/SliderControl";
import BlockConfigDefinitionRegistry, {
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
	BlockConfigRegToDefinition,
} from "shared/BlockConfigDefinitionRegistry";
import Objects from "shared/_fixes_/objects";

export type ConfigControlDefinition = GuiObject;
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

		const templates = GuiController.getGameUI<{ Templates: { Configuration: Template } }>().Templates.Configuration;
		this.checkboxTemplate = Control.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = Control.asTemplate(templates.KeyTemplate, false);
		this.sliderTemplate = Control.asTemplate(templates.SliderTemplate, false);
		this.numberTemplate = Control.asTemplate(templates.NumberTemplate, false);
		this.thrustTemplate = Control.asTemplate(templates.ThrustTemplate, false);
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

export abstract class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}

//

export class BoolConfigValueControl extends ConfigValueControl<CheckBoxControlDefinition> {
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

export class KeyBoolConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
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

export class KeyConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["key"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["key"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["key"]>,
	) {
		super(templates.key(), definition.displayName);

		const control = this.added(new KeyChooserControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

export class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
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

export class SliderConfigValueControl extends ConfigValueControl<SliderControlDefinition> {
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

export type ThrustConfigValueControlDefinition = ConfigControlDefinition;
export class ThrustConfigValueControl extends ConfigValueControl<ThrustConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["thrust"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["thrust"]>,
	) {
		super(templates.thrust(), definition.displayName);

		const control = this.added(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire({ ...config, [key]: value });
		});

		const def = {
			thrust_add: {
				displayName: "Thrust +",
				type: "key",
				default: "W" as KeyCode,
				config: "W" as KeyCode,
			},
			thrust_sub: {
				displayName: "Thrust -",
				type: "key",
				default: "S" as KeyCode,
				config: "S" as KeyCode,
			},
			switchmode: {
				displayName: "Toggle Mode",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			},
			strength: {
				displayName: "Strength %",
				type: "clampedNumber",
				min: 0,
				max: 100,
				step: 1,
				default: 100 as number,
				config: 100 as number,
			},
		} as const satisfies BlockConfigDefinitions;
		const _compilecheck: BlockConfigDefinitionsToConfig<typeof def> = config;

		control.set(config, def);
	}
}

export class MotorRotationSpeedConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["motorRotationSpeed"]>,
	) {
		super(templates.thrust(), definition.displayName);

		const control = this.added(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) => this.submitted.Fire({ ...config, [key]: value }));

		const def = {
			rotate_add: {
				displayName: "Rotate +",
				type: "key",
				default: "R" as KeyCode,
				config: "R" as KeyCode,
			},
			rotate_sub: {
				displayName: "Rotate -",
				type: "key",
				default: "F" as KeyCode,
				config: "F" as KeyCode,
			},
			speed: {
				displayName: "Max. speed",
				type: "clampedNumber",
				min: 0,
				max: 50,
				step: 1,
				default: 15 as number,
				config: 0 as number,
			},
			switchmode: {
				displayName: "Switch",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			},
		} as const satisfies BlockConfigDefinitions;
		const _compilecheck: BlockConfigDefinitionsToConfig<typeof def> = config;

		control.set(config, def);
	}
}

export class ServoMotorAngleConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["servoMotorAngle"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["servoMotorAngle"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["servoMotorAngle"]>,
	) {
		super(templates.thrust(), definition.displayName);

		const control = this.added(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) => this.submitted.Fire({ ...config, [key]: value }));

		const def = {
			rotate_add: {
				displayName: "Rotate +",
				type: "key",
				default: "R" as KeyCode,
				config: "R" as KeyCode,
			},
			rotate_sub: {
				displayName: "Rotate -",
				type: "key",
				default: "F" as KeyCode,
				config: "F" as KeyCode,
			},
			switchmode: {
				displayName: "Switch",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			},
			angle: {
				displayName: "Angle",
				type: "clampedNumber",
				default: -180 as number,
				min: 0,
				max: 359,
				step: 0.01,
				config: -180 as number,
			},
		} as const satisfies BlockConfigDefinitions;
		const _compilecheck: BlockConfigDefinitionsToConfig<typeof def> = config;

		control.set(config, def);
	}
}

//

export const configControls = {
	bool: BoolConfigValueControl,
	key: KeyConfigValueControl,
	keybool: KeyBoolConfigValueControl,
	number: NumberConfigValueControl,
	clampedNumber: SliderConfigValueControl,
	thrust: ThrustConfigValueControl,
	motorRotationSpeed: MotorRotationSpeedConfigValueControl,
	servoMotorAngle: ServoMotorAngleConfigValueControl,
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

export type Templates = {
	checkbox: () => ConfigPartDefinition<CheckBoxControlDefinition>;
	key: () => ConfigPartDefinition<KeyChooserControlDefinition>;
	slider: () => ConfigPartDefinition<SliderControlDefinition>;
	number: () => ConfigPartDefinition<NumberTextBoxControlDefinition>;
	thrust: () => ConfigPartDefinition<ThrustConfigValueControlDefinition>;
};

export type Template = {
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	ThrustTemplate: ConfigPartDefinition<ThrustConfigValueControlDefinition>;
};
