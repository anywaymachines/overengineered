import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import CheckBoxControl, { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import KeyChooserControl, { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "client/gui/controls/SliderControl";
import BlockConfigDefinitionRegistry, {
	BlockConfigDefinition,
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
	BlockConfigRegToDefinition,
} from "shared/BlockConfigDefinitionRegistry";
import Objects from "shared/fixes/objects";
import { DictionaryControl } from "../controls/DictionaryControl";
import TextBoxControl, { TextBoxControlDefinition } from "../controls/TextBoxControl";

type PartialIfObject<T> = T extends CheckableTypes[Exclude<keyof CheckableTypes, keyof CheckablePrimitives>]
	? T
	: Partial<T>;

export type ConfigControlDefinition = GuiObject;
export default class ConfigControl extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(
			key: string,
			value: PartialIfObject<BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]["config"]>,
		) => void
	>();

	private readonly connectedTemplate;
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;
	private readonly numberTemplate;
	private readonly stringTemplate;
	private readonly thrustTemplate;

	constructor(gui: ConfigControlDefinition) {
		super(gui);

		const templates = GuiController.getGameUI<{ Templates: { Configuration: Template } }>().Templates.Configuration;
		this.connectedTemplate = Control.asTemplate(templates.ConnectedTemplate, false);
		this.checkboxTemplate = Control.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = Control.asTemplate(templates.KeyTemplate, false);
		this.sliderTemplate = Control.asTemplate(templates.SliderTemplate, false);
		this.numberTemplate = Control.asTemplate(templates.NumberTemplate, false);
		this.stringTemplate = Control.asTemplate(templates.NumberTemplate, false);
		this.thrustTemplate = Control.asTemplate(templates.MultiTemplate, false);
	}

	set<TDef extends BlockConfigDefinitions>(
		config: BlockConfigDefinitionsToConfig<TDef>,
		definition: TDef,
		connected: readonly (keyof TDef)[] = [],
	) {
		this.clear();

		for (const [id, def] of Objects.pairs(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				this.add(new ConnectedValueControl(this.connectedTemplate(), def.displayName));
				continue;
			}

			const control = new configControls[def.type](
				{
					checkbox: this.checkboxTemplate,
					key: this.keyTemplate,
					number: this.numberTemplate,
					string: this.stringTemplate,
					slider: this.sliderTemplate,
					multi: this.thrustTemplate,
				},
				config[id] as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value));
		}
	}
}

type ConfigControl2Definition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigDefinitions, TKey extends keyof TDef> = (
	key: TKey,
	value: PartialIfObject<TDef[TKey]["config"]>,
) => void;
class ConfigControl2<TDef extends BlockConfigDefinitions> extends Control<ConfigControl2Definition> {
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef>>();

	private readonly connectedTemplate;
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;
	private readonly numberTemplate;
	private readonly stringTemplate;
	private readonly thrustTemplate;

	constructor(
		gui: ConfigControl2Definition,
		config: BlockConfigDefinitionsToConfig<TDef>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
	) {
		super(gui);

		const templates = GuiController.getGameUI<{ Templates: { Configuration: Template } }>().Templates.Configuration;
		this.connectedTemplate = Control.asTemplate(templates.ConnectedTemplate, false);
		this.checkboxTemplate = Control.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = Control.asTemplate(templates.KeyTemplate, false);
		this.sliderTemplate = Control.asTemplate(templates.SliderTemplate, false);
		this.numberTemplate = Control.asTemplate(templates.NumberTemplate, false);
		this.stringTemplate = Control.asTemplate(templates.StringTemplate, false);
		this.thrustTemplate = Control.asTemplate(templates.MultiTemplate, false);

		for (const [id, def] of Objects.pairs(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				this.add(new ConnectedValueControl(this.connectedTemplate(), def.displayName));
				continue;
			}

			const control = new configControls[def.type](
				{
					checkbox: this.checkboxTemplate,
					key: this.keyTemplate,
					number: this.numberTemplate,
					string: this.stringTemplate,
					slider: this.sliderTemplate,
					multi: this.thrustTemplate,
				},
				config[id] as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) =>
				this.configUpdated.Fire(id as string, value as PartialIfObject<TDef[keyof TDef]["config"]>),
			);
		}
	}
}

export abstract class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}

	protected sameOrUndefined<T>(configs: readonly T[]) {
		let value: T | undefined;
		for (const config of configs) {
			if (value !== undefined && value !== config) {
				value = undefined;
				break;
			}

			value = config;
		}

		return value;
	}
}
class ConnectedValueControl extends ConfigValueControl<GuiObject> {}

//

export class BoolConfigValueControl extends ConfigValueControl<CheckBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["bool"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["bool"]>,
	) {
		super(templates.checkbox(), definition.displayName);

		const control = this.add(new CheckBoxControl(this.gui.Control));
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
		super(templates.multi(), definition.displayName);

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

		const list = this.add(new Control<GuiObject, NumberConfigValueControl>(this.gui.Control));
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

export class KeyBoolConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["keybool"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["keybool"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["keybool"]>,
	) {
		super(templates.multi(), definition.displayName);

		const controlTemplate = Control.asTemplate(this.gui.Control);

		const def: Partial<Record<keyof BlockConfigDefinitionRegistry["keybool"]["config"], BlockConfigDefinition>> = {
			key: {
				displayName: "Key",
				type: "key",
				config: config.key,
				default: config.key,
			},
		};
		if (definition.canBeSwitch) {
			def.switch = {
				displayName: "Toggle mode",
				type: "bool",
				config: config.switch,
				default: config.switch,
			};
		}
		if (definition.canBeReversed) {
			def.reversed = {
				displayName: "Inverted",
				type: "bool",
				config: config.reversed,
				default: config.reversed,
			};
		}

		const control = this.add(new ConfigControl2(controlTemplate(), config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});
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

		const control = this.add(new KeyChooserControl(this.gui.Control));
		this.value = control.value;
		control.value.set(config);

		this.event.subscribe(control.submitted, (value, prev) => this.submitted.Fire(value, prev));
	}
}

export type MultiKeyConfigValueControlDefinition = ConfigControlDefinition;
export class MultiKeyConfigValueControl extends ConfigValueControl<MultiKeyConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: Partial<BlockConfigDefinitionRegistry["multikey"]["config"]>) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["multikey"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["multikey"]>,
	) {
		super(templates.multi(), definition.displayName);

		const list = this.add(new DictionaryControl<GuiObject, string, KeyConfigValueControl>(this.gui.Control));
		for (const [name, _] of Objects.pairs(definition.default)) {
			const control = new KeyConfigValueControl(templates, config[name], definition.keyDefinitions[name]);
			list.addKeyed(name, control);

			this.event.subscribe(control.submitted, (value, prev) => {
				const changed: (keyof typeof config)[] = [name];

				for (const [key, child] of list.getKeyedChildren()) {
					if (child === control) continue;

					if (child.value.get() === value) {
						child.value.set(prev);
						changed.push(key);
					}
				}

				const update = Objects.fromEntries(changed.map((c) => [c, list.getChild(c)!.value.get()] as const));
				config = { ...config, ...update };

				this.submitted.Fire(update);
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

		const control = this.add(new NumberTextBoxControl(this.gui.Control));
		this.value = control.value;
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

export class StringConfigValueControl extends ConfigValueControl<TextBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["string"]["config"]) => void>();
	readonly value;

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["string"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["string"]>,
	) {
		super(templates.number(), definition.displayName);

		const control = this.add(new TextBoxControl(this.gui.Control));
		this.value = control.text;
		control.text.set(config);

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

		const control = this.add(new SliderControl(this.gui.Control, definition.min, definition.max, definition.step));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

export type ThrustConfigValueControlDefinition = ConfigControlDefinition;
export class ThrustConfigValueControl extends ConfigValueControl<ThrustConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: Partial<BlockConfigDefinitionRegistry["thrust"]["config"]>) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["thrust"]>,
	) {
		super(templates.multi(), definition.displayName);

		const control = this.add(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire({ [key]: value });
			config = { ...config, [key]: value };
		});

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
						displayName: "+",
						type: "key",
						default: "W",
						config: "W",
					},
					sub: {
						displayName: "-",
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
		} as const satisfies BlockConfigDefinitions;
		const _compilecheck: BlockConfigDefinitionsToConfig<typeof def> = config;

		control.set(config, def);
	}
}

export class MotorRotationSpeedConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<
		(config: Partial<BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"]>) => void
	>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["motorRotationSpeed"]>,
	) {
		super(templates.multi(), definition.displayName);

		const control = this.add(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire({ [key]: value });
			config = { ...config, [key]: value };
		});

		const def = {
			rotation: {
				displayName: "Rotation",
				type: "multikey",
				config: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				default: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				keyDefinitions: {
					add: {
						displayName: "+",
						type: "key",
						default: "R" as KeyCode,
						config: "R" as KeyCode,
					},
					sub: {
						displayName: "-",
						type: "key",
						default: "F" as KeyCode,
						config: "F" as KeyCode,
					},
				},
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
	readonly submitted = new Signal<
		(config: Partial<BlockConfigDefinitionRegistry["servoMotorAngle"]["config"]>) => void
	>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["servoMotorAngle"]["config"],
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["servoMotorAngle"]>,
	) {
		super(templates.multi(), definition.displayName);

		const control = this.add(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire((config = { ...config, [key]: value })),
		);

		const def = {
			rotation: {
				displayName: "Rotation",
				type: "multikey",
				config: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				default: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				keyDefinitions: {
					add: {
						displayName: "+",
						type: "key",
						default: "R" as KeyCode,
						config: "R" as KeyCode,
					},
					sub: {
						displayName: "-",
						type: "key",
						default: "F" as KeyCode,
						config: "F" as KeyCode,
					},
				},
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
		throw "Not implemented (waiting for dropdown implementation)";
		super(templates.multi(), definition.displayName);

		const control = this.add(new ConfigControl(this.gui.Control));
		this.event.subscribe(control.configUpdated, (key, value) =>
			this.submitted.Fire(
				(config = value as BlockConfigDefinitionRegistry[Exclude<
					keyof BlockConfigDefinitionRegistry,
					"or"
				>]["default"]),
			),
		);

		const def = Objects.fromEntries(
			definition.types.map((t) => [t.type, { ...t, displayName: definition.displayName }] as const),
		);
		control.set(config as BlockConfigDefinitionsToConfig<typeof def>, def);
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
	string: StringConfigValueControl,
	clampedNumber: SliderConfigValueControl,
	thrust: ThrustConfigValueControl,
	motorRotationSpeed: MotorRotationSpeedConfigValueControl,
	servoMotorAngle: ServoMotorAngleConfigValueControl,
	or: OrConfigValueControl,
} as const satisfies {
	readonly [k in keyof BlockConfigDefinitionRegistry]: {
		new (
			templates: Templates,
			config: BlockConfigDefinitionRegistry[k]["config"] & defined,
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
	string: () => ConfigPartDefinition<TextBoxControlDefinition>;
	multi: () => ConfigPartDefinition<ConfigControlDefinition>;
};

export type Template = {
	ConnectedTemplate: ConfigPartDefinition<GuiObject>;
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
	MultiTemplate: ConfigPartDefinition<ConfigControlDefinition>;
};
