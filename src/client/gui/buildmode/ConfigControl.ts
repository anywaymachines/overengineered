import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { ButtonControl } from "client/gui/controls/Button";
import { CheckBoxControl, CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { DropdownList, DropdownListDefinition } from "client/gui/controls/DropdownList";
import { KeyChooserControl, KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import { NumberTextBoxControl, NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl, SliderControlDefinition } from "client/gui/controls/SliderControl";
import { TextBoxControl, TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import { BlockManager } from "shared/building/BlockManager";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";

type PartialIfObject<T> = T extends CheckableTypes[Exclude<keyof CheckableTypes, keyof CheckablePrimitives>]
	? T
	: Partial<T>;

type BlockConfigDefinitionRegistry = BlockConfigTypes.Types;
type BlockConfigDefinitions = BlockConfigTypes.Definitions;

export type ConfigControlDefinition = GuiObject;
export class ConfigControl extends Control<ConfigControlDefinition> {
	readonly travelToConnectedPressed = new Signal<(uuid: BlockUuid) => void>();
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
	private readonly multiTemplate;
	private readonly multiMultiTemplate;

	constructor(gui: ConfigControlDefinition) {
		super(gui);

		const templates = Gui.getGameUI<{ Templates: { Config: Template } }>().Templates.Config;
		this.connectedTemplate = this.asTemplate(templates.ConnectedTemplate, false);
		this.checkboxTemplate = this.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = this.asTemplate(templates.KeyTemplate, false);
		this.sliderTemplate = this.asTemplate(templates.SliderTemplate, false);
		this.numberTemplate = this.asTemplate(templates.NumberTemplate, false);
		this.stringTemplate = this.asTemplate(templates.StringTemplate, false);
		this.multiTemplate = this.asTemplate(templates.MultiTemplate, false);
		this.multiMultiTemplate = this.asTemplate(templates.MultiMultiTemplate, false);
	}

	set<TDef extends BlockConfigDefinitions>(
		config: ConfigDefinitionsToConfig<keyof TDef, TDef>,
		definition: TDef,
		connected: readonly (keyof TDef)[] = [],
		block?: BlockModel,
	) {
		this.clear();

		for (const [id, def] of Objects.entriesArray(definition).sort(
			(left, right) => tostring(left[0]) < tostring(right[0]),
		)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				const connected = this.add(new ConnectedValueControl(this.connectedTemplate(), def.displayName));
				connected.travelToConnectedPressed.Connect(() =>
					this.travelToConnectedPressed.Fire(
						BlockManager.manager.connections.get(block!)?.[id as BlockConnectionName].blockUuid,
					),
				);

				continue;
			}

			const control = new configControls[def.type](
				{
					checkbox: this.checkboxTemplate,
					key: this.keyTemplate,
					number: this.numberTemplate,
					string: this.stringTemplate,
					slider: this.sliderTemplate,
					multi: this.multiTemplate,
					multiMulti: this.multiMultiTemplate,
				},
				config[id] as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value as never));
		}
	}
}

type ConfigControl2Definition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigDefinitions, TKey extends keyof TDef> = (
	key: TKey,
	value: PartialIfObject<TDef[TKey]["config"]>,
) => void;
export class ConfigControl2<TDef extends BlockConfigDefinitions> extends Control<ConfigControl2Definition> {
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef>>();

	private readonly connectedTemplate;
	private readonly checkboxTemplate;
	private readonly keyTemplate;
	private readonly sliderTemplate;
	private readonly numberTemplate;
	private readonly stringTemplate;
	private readonly thrustTemplate;
	private readonly multiMultiTemplate;

	constructor(
		gui: ConfigControl2Definition,
		config: ConfigDefinitionsToConfig<keyof TDef, TDef>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
	) {
		super(gui);

		const templates = Gui.getGameUI<{ Templates: { Config: Template } }>().Templates.Config;
		this.connectedTemplate = this.asTemplate(templates.ConnectedTemplate, false);
		this.checkboxTemplate = this.asTemplate(templates.CheckboxTemplate, false);
		this.keyTemplate = this.asTemplate(templates.KeyTemplate, false);
		this.sliderTemplate = this.asTemplate(templates.SliderTemplate, false);
		this.numberTemplate = this.asTemplate(templates.NumberTemplate, false);
		this.stringTemplate = this.asTemplate(templates.StringTemplate, false);
		this.thrustTemplate = this.asTemplate(templates.MultiTemplate, false);
		this.multiMultiTemplate = this.asTemplate(templates.MultiMultiTemplate, false);

		for (const [id, def] of Objects.pairs_(definition)) {
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
					multiMulti: this.multiMultiTemplate,
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

type ConnectedValueControlDefinition = GuiButton;
class ConnectedValueControl extends ConfigValueControl<ConnectedValueControlDefinition> {
	private readonly _travelToConnectedPressed = new Signal();
	readonly travelToConnectedPressed = this._travelToConnectedPressed.asReadonly();

	constructor(gui: ConfigPartDefinition<ConnectedValueControlDefinition>, name: string) {
		super(gui, name);

		const locate = this.add(new ButtonControl(gui.Control));
		locate.activated.Connect(() => this._travelToConnectedPressed.Fire());
	}
}

//

export class BoolConfigValueControl extends ConfigValueControl<CheckBoxControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["bool"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["bool"]>,
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["vector3"]>,
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
		} satisfies Record<string, ConfigTypeToDefinition<BlockConfigDefinitionRegistry["number"]>>;

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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["keybool"]>,
	) {
		super(templates.multi(), definition.displayName);

		const controlTemplate = this.asTemplate(this.gui.Control);

		const def: Partial<
			Record<keyof BlockConfigDefinitionRegistry["keybool"]["config"], BlockConfigTypes.Definition>
		> = {
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["key"]>,
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["multikey"]>,
	) {
		super(templates.multi(), definition.displayName);

		const list = this.add(new DictionaryControl<GuiObject, string, KeyConfigValueControl>(this.gui.Control));
		for (const [name, _] of Objects.pairs_(definition.default)) {
			const control = new KeyConfigValueControl(templates, config[name], definition.keyDefinitions[name]);
			list.keyedChildren.add(name, control);

			this.event.subscribe(control.submitted, (value, prev) => {
				const changed: (keyof typeof config)[] = [name];

				for (const [key, child] of list.keyedChildren.getAll()) {
					if (child === control) continue;

					if (child.value.get() === value) {
						child.value.set(prev);
						changed.push(key);
					}
				}

				const update = Objects.fromEntries(
					changed.map((c) => [c, list.keyedChildren.get(c)!.value.get()] as const),
				);
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["number"]>,
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["string"]>,
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["clampedNumber"]>,
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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["thrust"]>,
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
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["motorRotationSpeed"]>,
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
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

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
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["servoMotorAngle"]>,
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
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

		control.set(config, def);
	}
}

export type MultiConfigControlDefinition = GuiObject & {
	readonly Dropdown: DropdownListDefinition;
	readonly Control: ConfigControlDefinition;
};
export class OrConfigValueControl extends ConfigValueControl<MultiConfigControlDefinition> {
	readonly submitted = new Signal<(config: BlockConfigDefinitionRegistry["or"]["config"]) => void>();

	constructor(
		templates: Templates,
		config: BlockConfigDefinitionRegistry["or"]["config"],
		definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry["or"]>,
	) {
		super(templates.multiMulti(), definition.displayName);

		let selected = config.type;
		if (config.value === undefined && selected !== "unset") {
			config = {
				...config,
				value: definition.types[selected]?.config as never,
			};
		}

		const updateConfig = (value: typeof config.value) => {
			this.submitted.Fire(
				(config = {
					type: selected,
					value,
				}),
			);
		};

		const control = this.add(new ConfigControl(this.gui.Control.Control));
		this.event.subscribe(control.configUpdated, (_, value) => updateConfig(value as typeof config.value));
		if (config.type !== "unset") {
			control.set({ value: config.value }, { value: definition.types[config.type]! });
		}

		const dropdown = this.add(
			new DropdownList<keyof typeof definition.types | "unset">(this.gui.Control.Dropdown, "down"),
		);
		this.event.subscribeObservable(dropdown.selectedItem, (typeid) => {
			// eslint-disable-next-line roblox-ts/lua-truthiness
			if (!typeid) {
				dropdown.selectedItem.set(config.type);
				return;
			}

			if (typeid === "unset") {
				control.clear();
				updateConfig("unset");
				return;
			}

			const deftype = definition.types[typeid]!;
			selected = deftype.type;

			if (config.type === deftype.type) {
				// use existing value
				control.set({ value: config.value }, { value: deftype });
				updateConfig(config.value);
			} else {
				// use default value
				control.set({ value: deftype.config }, { value: deftype });
				updateConfig(deftype.config as typeof config.value);
			}
		});

		dropdown.addItem("unset");
		for (const [, type] of Objects.pairs_(definition.types)) {
			dropdown.addItem(type.type);
		}

		dropdown.selectedItem.set(config.type);
	}
}

//

const configControls = {
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
			definition: ConfigTypeToDefinition<BlockConfigDefinitionRegistry[k]>,
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
	multiMulti: () => ConfigPartDefinition<MultiConfigControlDefinition>;
};

export type Template = {
	ConnectedTemplate: ConfigPartDefinition<ConnectedValueControlDefinition>;
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
	MultiTemplate: ConfigPartDefinition<ConfigControlDefinition>;
	MultiMultiTemplate: ConfigPartDefinition<MultiConfigControlDefinition>;
};
