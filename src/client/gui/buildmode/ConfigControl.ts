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
	private readonly multiKeyTemplate;
	private readonly sliderTemplate;
	private readonly numberTemplate;
	private readonly thrustTemplate;

	constructor(gui: ConfigControlDefinition) {
		super(gui);

		const templates = GuiController.getGameUI<{ Templates: { Configuration: Template } }>().Templates.Configuration;
		this.checkboxTemplate = Control.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = Control.asTemplate(templates.KeyTemplate, false);
		this.multiKeyTemplate = Control.asTemplate(templates.MultiKeyTemplate, false);
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
					multikey: this.multiKeyTemplate,
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

export type Vector3ConfigValueControlDefinition = ConfigControlDefinition;
export class Vector3ConfigValueControl extends ConfigValueControl<Vector3ConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["vector3"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["vector3"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["vector3"]>,
	) {
		super(templates.multikey(), definition.displayName);

		const defs = {
			X: {
				displayName: "X",
				type: "number",
				default: 0,
				config: 0,
			},
			Y: {
				displayName: "Y",
				type: "number",
				default: 0,
				config: 0,
			},
			Z: {
				displayName: "Z",
				type: "number",
				default: 0,
				config: 0,
			},
		} satisfies Record<string, BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["number"]>>;

		const list = this.added(new Control<GuiObject, NumberConfigValueControl>(this.gui.Control));
		const create = (key: keyof typeof defs) => {
			const control = new NumberConfigValueControl(templates, config[key], defs[key]);
			list.add(control);

			this.event.subscribe(control.submitted, () =>
				this.submitted.Fire((config = new Vector3(x.value.get(), y.value.get(), z.value.get()))),
			);

			return control;
		};

		const x = create("X");
		const y = create("Y");
		const z = create("Z");
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
	readonly submitted = new Signal<
		(
			config: BlockConfigDefinitionRegistry["key"]["config"],
			prev: BlockConfigDefinitionRegistry["key"]["config"],
		) => void
	>();
	readonly value;

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["key"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["key"]>,
	) {
		super(templates.key(), definition.displayName);

		const control = this.added(new KeyChooserControl(this.gui.Control));
		this.value = control.value;
		control.value.set(config);

		this.event.subscribe(control.submitted, (value, prev) => this.submitted.Fire(value, prev));
	}
}

export type MultiKeyConfigValueControlDefinition = ConfigControlDefinition;
export class MultiKeyConfigValueControl extends ConfigValueControl<MultiKeyConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["multikey"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["multikey"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["multikey"]>,
	) {
		super(templates.multikey(), definition.displayName);

		const controls = new Map<string, KeyConfigValueControl>();

		const list = this.added(new Control<GuiObject, KeyConfigValueControl>(this.gui.Control));
		for (const name of Objects.keys(definition.default)) {
			const control = new KeyConfigValueControl(templates, config[name], definition.keyDefinitions[name]);
			list.add(control);
			controls.set(name, control);

			this.event.subscribe(control.submitted, (value, prev) => {
				for (const child of list.getChildren()) {
					if (child === control) continue;

					if (child.value.get() === value) {
						child.value.set(prev);
					}
				}

				this.submitted.Fire(
					(config = Objects.fromEntries([...controls].map((c) => [c[0], c[1].value.get()] as const))),
				);
			});
		}
	}
}

export class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["number"]["config"]) => void>();
	readonly value;

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["number"]>,
	) {
		super(templates.number(), definition.displayName);

		const control = this.added(new NumberTextBoxControl(this.gui.Control));
		this.value = control.value;
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
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire((config = { ...config, [key]: value })),
		);

		const def = {
			thrust: {
				displayName: "Thrust",
				type: "multikey",
				default: {
					add: "W" as KeyCode,
					sub: "S" as KeyCode,
				},
				config: {
					add: "W" as KeyCode,
					sub: "S" as KeyCode,
				},
				keyDefinitions: {
					add: {
						displayName: "Thrust +",
						type: "key",
						default: "W",
						config: "W",
					},
					sub: {
						displayName: "Thrust -",
						type: "key",
						default: "S",
						config: "S",
					},
				},
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
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire((config = { ...config, [key]: value })),
		);

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
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire((config = { ...config, [key]: value })),
		);

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

export class OrConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["or"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["or"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["or"]>,
	) {
		super(templates.thrust(), definition.displayName);

		const control = this.added(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire(
				(config = {
					type: key as Exclude<keyof BlockConfigDefinitionRegistry, "or">,
					value: value as BlockConfigDefinitionRegistry[Exclude<
						keyof BlockConfigDefinitionRegistry,
						"or"
					>]["default"],
				}),
			),
		);

		const def = Objects.fromEntries(
			definition.types.map((t) => [t.type, { ...t, displayName: definition.displayName }] as const),
		);
		control.set(config.value as BlockConfigDefinitionsToConfig<typeof def>, def);
	}
}

//

export const configControls = {
	bool: BoolConfigValueControl,
	vector3: Vector3ConfigValueControl,
	key: KeyConfigValueControl,
	multikey: MultiKeyConfigValueControl,
	keybool: KeyBoolConfigValueControl,
	number: NumberConfigValueControl,
	clampedNumber: SliderConfigValueControl,
	thrust: ThrustConfigValueControl,
	motorRotationSpeed: MotorRotationSpeedConfigValueControl,
	servoMotorAngle: ServoMotorAngleConfigValueControl,
	or: OrConfigValueControl,
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
	multikey: () => ConfigPartDefinition<MultiKeyConfigValueControlDefinition>;
	slider: () => ConfigPartDefinition<SliderControlDefinition>;
	number: () => ConfigPartDefinition<NumberTextBoxControlDefinition>;
	thrust: () => ConfigPartDefinition<ThrustConfigValueControlDefinition>;
};

export type Template = {
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	MultiKeyTemplate: ConfigPartDefinition<MultiKeyConfigValueControlDefinition>;
	SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	ThrustTemplate: ConfigPartDefinition<ThrustConfigValueControlDefinition>;
};
