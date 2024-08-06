import { ColorChooser } from "client/gui/ColorChooser";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { ByteEditor } from "client/gui/controls/ByteEditorControl";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyOrStringChooserControl } from "client/gui/controls/KeyOrStringChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { Gui } from "client/gui/Gui";
import { MemoryEditorPopup } from "client/gui/popup/MemoryEditorPopup";
import { BlockManager } from "shared/building/BlockManager";
import { Element } from "shared/Element";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal, Signal } from "shared/event/Signal";
import { JSON } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ByteEditorDefinition } from "client/gui/controls/ByteEditorControl";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { KeyOrStringChooserControlDefinition } from "client/gui/controls/KeyOrStringChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import type { ReadonlyArgsSignal } from "shared/event/Signal";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};
type ConfigValueControlParams<T extends UnknownConfigType> = {
	readonly configs: Readonly<Record<BlockUuid, T["config"]>>;
	readonly definition: ConfigTypeToDefinition<T>;
};
class ConfigValueControl<TGui extends GuiObject, TType extends UnknownConfigType> extends Control<
	ConfigPartDefinition<TGui>
> {
	protected readonly _submitted = new Signal<
		(
			config: Readonly<Record<BlockUuid, TType["config"]>>,
			prev: Readonly<Record<BlockUuid, TType["config"]>>,
		) => void
	>();
	readonly submitted = this._submitted.asReadonly();

	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}

	protected sameOrUndefined<T>(configs: Readonly<Record<BlockUuid, T>>, comparer?: (left: T, right: T) => boolean) {
		let value: T | undefined;
		for (const [_, config] of pairs(configs)) {
			if (value !== undefined && !(comparer?.(value, config) ?? value === config)) {
				value = undefined;
				break;
			}

			value = config;
		}

		return value;
	}
	protected map<T, TOut extends defined>(
		configs: Readonly<Record<BlockUuid, T>>,
		mapfunc: (value: T, key: BlockUuid) => TOut,
	): Readonly<Record<BlockUuid, TOut>> {
		return Objects.fromEntries(Objects.entriesArray(configs).map((e) => [e[0], mapfunc(e[1], e[0])] as const));
	}
}

const templateFolder = Gui.getGameUI<{
	readonly Templates: {
		readonly Config: {
			readonly ConnectedTemplate: ConfigPartDefinition<GuiButton>;
			readonly CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
			readonly KeyTemplate: ConfigPartDefinition<KeyOrStringChooserControlDefinition>;
			readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
			readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
			readonly StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
			readonly MultiTemplate: ConfigPartDefinition<GuiObject>;
			readonly MultiMultiTemplate: ConfigPartDefinition<ControlsSource.OrConfigControlDefinition>;
			readonly ColorTemplate: ConfigPartDefinition<ColorChooserDefinition>;
			readonly ByteTemplate: ConfigPartDefinition<ByteEditorDefinition>;
			readonly ByteArrayTemplate: ConfigPartDefinition<GuiButton>;
		};
	};
}>().Templates.Config;
const templates = {
	connected: Control.asTemplateWithMemoryLeak(templateFolder.ConnectedTemplate, false),
	checkbox: Control.asTemplateWithMemoryLeak(templateFolder.CheckboxTemplate, false),
	key: Control.asTemplateWithMemoryLeak(templateFolder.KeyTemplate, false),
	slider: Control.asTemplateWithMemoryLeak(templateFolder.SliderTemplate, false),
	number: Control.asTemplateWithMemoryLeak(templateFolder.NumberTemplate, false),
	string: Control.asTemplateWithMemoryLeak(templateFolder.StringTemplate, false),
	multi: Control.asTemplateWithMemoryLeak(templateFolder.MultiTemplate, false),
	multiMulti: Control.asTemplateWithMemoryLeak(templateFolder.MultiMultiTemplate, false),
	color: Control.asTemplateWithMemoryLeak(templateFolder.ColorTemplate, false),
	byte: Control.asTemplateWithMemoryLeak(templateFolder.ByteTemplate, false),
	bytearray: Control.asTemplateWithMemoryLeak(templateFolder.ByteArrayTemplate, false),
} as const;

namespace ControlsSource {
	export class bool extends ConfigValueControl<CheckBoxControlDefinition, BlockConfigTypes.Bool> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Bool>) {
			super(templates.checkbox(), definition.displayName);

			const control = this.add(new CheckBoxControl(this.gui.Control));
			control.value.set(this.sameOrUndefined(configs));
			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export class bytearray extends ConfigValueControl<GuiButton, BlockConfigTypes.ByteArray> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.ByteArray>) {
			super(templates.bytearray(), definition.displayName);

			let value = this.sameOrUndefined(configs, (left, right) => {
				if (left.size() !== right.size()) {
					return false;
				}

				for (let i = 0; i < left.size(); i++) {
					if (left[i] !== right[i]) {
						return false;
					}
				}

				return true;
			});

			const control = this.add(
				new ButtonControl(this.gui.Control, () => {
					MemoryEditorPopup.showPopup(definition.lengthLimit, [...(value ?? [])], (newval) => {
						value = newval;
						const prev = configs;
						this._submitted.Fire((configs = this.map(configs, () => newval)), prev);
					});
				}),
			);

			if (!value) {
				control.setInteractable(false);
			}
		}
	}
	export class byte extends ConfigValueControl<ByteEditorDefinition, BlockConfigTypes.Byte> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Byte>) {
			super(templates.byte(), definition.displayName);

			// TODO: Mixed values
			const control = this.add(new ByteEditor(this.gui.Control));
			control.value.set(this.sameOrUndefined(this.map(configs, (c) => c)) ?? 0);
			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export class clampedNumber extends ConfigValueControl<SliderControlDefinition, BlockConfigTypes.ClampedNumber> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.ClampedNumber>) {
			super(templates.slider(), definition.displayName);

			class ClampedConfigNumberControl extends Control<SliderControlDefinition> {
				readonly submitted;

				constructor(
					gui: SliderControlDefinition,
					def: number | undefined,
					min: number,
					max: number,
					step: number,
				) {
					super(gui);

					const cb = this.add(new SliderControl<true>(gui, min, max, step));
					this.submitted = cb.submitted;

					cb.value.set(def);
				}
			}
			const control = this.add(
				new ClampedConfigNumberControl(
					this.gui.Control,
					this.sameOrUndefined(configs),
					definition.min,
					definition.max,
					definition.step,
				),
			);
			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export class color extends ConfigValueControl<ColorChooserDefinition, BlockConfigTypes.Color> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Color>) {
			super(templates.color(), definition.displayName);

			const control = this.add(new ColorChooser(this.gui.Control));
			control.value.set(this.sameOrUndefined(configs) ?? Color3.fromRGB(255, 255, 255));

			this.event.subscribe(control.value.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export class controllableNumber extends ConfigValueControl<GuiObject, BlockConfigTypes.ControllableNumber> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.ControllableNumber>) {
			super(templates.multi(), definition.displayName);

			const def: Partial<
				Record<keyof BlockConfigTypes.ControllableNumber["config"], BlockConfigTypes.Definition>
			> = {
				value: {
					displayName: "Value",
					type: "clampedNumber",
					min: definition.min,
					max: definition.max,
					step: definition.step,
					default: definition.default,
					config: definition.config.value,
				},
				control: {
					displayName: "Thrust",
					type: "multikey",
					default: definition.config.control,
					config: definition.config.control,
					keyDefinitions: {
						add: {
							displayName: "+",
							type: "key",
							default: definition.config.control.add,
							config: definition.config.control.add,
						},
						sub: {
							displayName: "-",
							type: "key",
							default: definition.config.control.sub,
							config: definition.config.control.sub,
						},
					},
				},
			};

			const controlTemplate = this.asTemplate(this.gui.Control);
			const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
			this.event.subscribe(control.configUpdated, (key, values) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
			});
		}
	}
	export class keybool extends ConfigValueControl<GuiObject, BlockConfigTypes.KeyBool> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.KeyBool>) {
			super(templates.multi(), definition.displayName);
			const controlTemplate = this.asTemplate(this.gui.Control);

			const def: Partial<Record<keyof BlockConfigTypes.KeyBool["config"], BlockConfigTypes.Definition>> = {
				key: {
					displayName: "Key",
					type: "key",
					config: definition.config.key,
					default: definition.config.key,
				},
			};
			if (definition.canBeSwitch) {
				def.switch = {
					displayName: "Toggle mode",
					type: "bool",
					config: definition.config.switch,
					default: definition.config.switch,
				};
			}
			if (definition.canBeReversed) {
				def.reversed = {
					displayName: "Inverted",
					type: "bool",
					config: definition.config.reversed,
					default: definition.config.reversed,
				};
			}

			const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
			this.event.subscribe(control.configUpdated, (key, values) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
			});
		}
	}
	export class key extends ConfigValueControl<KeyOrStringChooserControlDefinition, BlockConfigTypes.Key> {
		readonly values = new ObservableValue<Readonly<Record<BlockUuid, string>>>({});

		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Key>) {
			super(templates.key(), definition.displayName);

			const control = this.add(new KeyOrStringChooserControl<true>(this.gui.Control));
			this.values.set(configs);
			this.event.subscribeObservable(this.values, (values) =>
				control.value.set(this.sameOrUndefined((configs = values))),
			);

			control.value.set(this.sameOrUndefined(configs));
			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;

				configs = this.map(configs, () => value);
				this.values.set(configs);
				this._submitted.Fire(configs, prev);
			});
		}
	}
	export class motorRotationSpeed extends ConfigValueControl<GuiObject, BlockConfigTypes.MotorRotationSpeed> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.MotorRotationSpeed>) {
			super(templates.multi(), definition.displayName);

			const def: Partial<
				Record<keyof BlockConfigTypes.MotorRotationSpeed["config"], BlockConfigTypes.Definition>
			> = {
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
					min: definition.default,
					max: definition.maxSpeed,
					step: 0.01,
					default: definition.default,
					config: 0 as number,
				},
				switchmode: {
					displayName: "Switch",
					type: "bool",
					default: false as boolean,
					config: false as boolean,
				},
			};

			const controlTemplate = this.asTemplate(this.gui.Control);
			const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
			this.event.subscribe(control.configUpdated, (key, values) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
			});
		}
	}
	export class multikey extends ConfigValueControl<GuiObject, BlockConfigTypes.MultiKey> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.MultiKey>) {
			super(templates.multi(), definition.displayName);

			if (Objects.size(definition.keyDefinitions) !== 2) {
				throw "Unsupported keydef size";
			}

			const list = this.add(new DictionaryControl<GuiObject, string, key>(this.gui.Control));
			for (const [name, _] of pairs(definition.default)) {
				const cfgs = Objects.fromEntries(
					Objects.entriesArray(configs).map(([uuid, config]) => [uuid, config[name]]),
				);

				const control = new key({
					configs: cfgs,
					definition: definition.keyDefinitions[name],
				});
				list.keyedChildren.add(name, control);

				this.event.subscribe(control.submitted, (value, prev) => {
					const changed: (keyof (typeof configs)[BlockUuid])[] = [name];
					const newvalue = Objects.firstValue(value)!;
					const prevval = asMap(prev).findValue((p) => p !== newvalue);
					if (prevval === undefined) {
						throw "what";
					}

					for (const [key, child] of list.keyedChildren.getAll()) {
						if (child === control) continue;

						for (const [, value] of pairs(child.values.get())) {
							if (newvalue === value) {
								child.values.set(this.map(configs, () => prevval));
								print("setting mega cvhild values", JSON.serialize(child.values.get()));
								changed.push(key);
								break;
							}
						}
					}

					const thisprev = configs;
					const update = Objects.fromEntries(
						changed.map((c) => [c, Objects.firstValue(list.keyedChildren.get(c)!.values.get()!)!] as const),
					);
					configs = this.map(configs, (c) => ({ ...c, ...update }));
					this._submitted.Fire(configs, thisprev);
				});
			}
		}
	}
	export class _number extends ConfigValueControl<NumberTextBoxControlDefinition, BlockConfigTypes.Number> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Number>) {
			super(templates.number(), definition.displayName);

			class ConfigNumberControl extends Control<NumberTextBoxControlDefinition> {
				readonly submitted;

				constructor(gui: NumberTextBoxControlDefinition, def: number | undefined) {
					super(gui);

					const cb = this.add(new NumberTextBoxControl<true>(gui));
					this.submitted = cb.submitted;

					cb.value.set(def);
				}
			}
			const control = this.add(new ConfigNumberControl(this.gui.Control, this.sameOrUndefined(configs)));
			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export type OrConfigControlDefinition = GuiObject & {
		readonly Dropdown: DropdownListDefinition;
		readonly Control: GuiObject;
	};
	export class _or extends ConfigValueControl<OrConfigControlDefinition, BlockConfigTypes.Or> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Or>) {
			super(templates.multiMulti(), definition.displayName);

			let currentType = this.sameOrUndefined(this.map(configs, (c) => c.type));

			const submit = (values: Readonly<Record<BlockUuid, BlockConfigTypes.Or["config"]["value"]>>) => {
				if (!currentType) return;

				const prev = configs;
				this._submitted.Fire(
					(configs = this.map(configs, (_, k) => ({ type: currentType!, value: values[k] }))),
					prev,
				);
			};

			let mcontrol:
				| MultiConfigControl<{ value: BlockConfigTypes.Types[Exclude<keyof BlockConfigTypes.Types, "or">] }>
				| undefined = undefined;
			const updateControl = () => {
				mcontrol?.destroy();

				if (currentType === undefined || currentType === "unset") {
					return;
				}

				const gui = Element.create("Frame", {
					BackgroundTransparency: 1,
					Size: new UDim2(1, 0, 0, 0),
					AutomaticSize: Enum.AutomaticSize.Y,
					Parent: this.gui.Control.Control,
				});

				const defs = { value: definition.types[currentType]! };
				mcontrol = this.add(new MultiConfigControl<typeof defs>(gui, configs, defs));
				mcontrol.configUpdated.Connect((_, values) => submit(values));
			};
			updateControl();

			const dropdown = this.add(
				new DropdownList<keyof typeof definition.types | "unset">(this.gui.Control.Dropdown),
			);
			this.event.subscribeObservable(dropdown.selectedItem, (typeid) => {
				// eslint-disable-next-line roblox-ts/lua-truthiness
				if (!typeid) {
					dropdown.selectedItem.set("unset");
					return;
				}

				currentType = typeid;

				const values = this.map(configs, (c, k) => {
					if (c.type === typeid) {
						return c.value;
					}

					return typeid === "unset" ? "unset" : definition.types[typeid]!.default;
				});

				submit(values);
				updateControl();
			});

			const names: { readonly [k in keyof BlockConfigTypes.Types]: string } = {
				bool: "Bit",
				vector3: "Vector3",
				number: "Number",
				clampedNumber: "Number",
				string: "Text",
				color: "Color",
				byte: "Byte",
				bytearray: "Byte array",
				key: "Key",
				multikey: "Multi key",
				keybool: "Controlled key",
				controllableNumber: "Controlled number",
				motorRotationSpeed: "Motor speed",
				servoMotorAngle: "Servo angle",
				thrust: "Thrust strength",
				or: "Multi",
			};

			dropdown.addItem("unset");
			for (const [, type] of pairs(definition.types)) {
				dropdown.addItem(type.type, names[type.type]);
			}

			dropdown.selectedItem.set(currentType);
		}
	}
	export class servoMotorAngle extends ConfigValueControl<GuiObject, BlockConfigTypes.ServoMotorAngle> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.ServoMotorAngle>) {
			super(templates.multi(), definition.displayName);

			const def: Partial<Record<keyof BlockConfigTypes.ServoMotorAngle["config"], BlockConfigTypes.Definition>> =
				{
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
						default: (definition.minAngle + definition.maxAngle) / 2,
						min: definition.minAngle,
						max: definition.maxAngle,
						step: 0.01,
						config: (definition.minAngle + definition.maxAngle) / 2,
					},
				};

			const controlTemplate = this.asTemplate(this.gui.Control);
			const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
			this.event.subscribe(control.configUpdated, (key, values) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
			});
		}
	}
	export class _string extends ConfigValueControl<TextBoxControlDefinition, BlockConfigTypes.String> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.String>) {
			super(templates.string(), definition.displayName);

			const control = this.add(new TextBoxControl(this.gui.Control));
			control.text.set(this.sameOrUndefined(configs) ?? "");

			this.event.subscribe(control.submitted, (value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			});
		}
	}
	export class thrust extends ConfigValueControl<GuiObject, BlockConfigTypes.Thrust> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Thrust>) {
			super(templates.multi(), definition.displayName);

			const def: Partial<Record<keyof BlockConfigTypes.Thrust["config"], BlockConfigTypes.Definition>> = {
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
			};

			if (definition.canBeSwitch) {
				def.switchmode = {
					displayName: "Toggle Mode",
					type: "bool",
					default: false as boolean,
					config: false as boolean,
				};
			}

			const controlTemplate = this.asTemplate(this.gui.Control);
			const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
			this.event.subscribe(control.configUpdated, (key, values) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
			});
		}
	}
	export class vector3 extends ConfigValueControl<GuiObject, BlockConfigTypes.Vec3> {
		constructor({ configs, definition }: ConfigValueControlParams<BlockConfigTypes.Vec3>) {
			super(templates.multi(), definition.displayName);

			const withval = (vec: Vector3, value: number, key: keyof typeof def) => {
				if (key === "X") return new Vector3(value, vec.Y, vec.Z);
				if (key === "Y") return new Vector3(vec.X, value, vec.Z);
				if (key === "Z") return new Vector3(vec.X, vec.Y, value);

				throw "Invalid key";
			};

			const def = {
				X: {
					displayName: "X",
					type: "number",
					config: definition.config.X,
					default: definition.default.X,
				},
				Y: {
					displayName: "Y",
					type: "number",
					config: definition.config.Y,
					default: definition.default.Y,
				},
				Z: {
					displayName: "Z",
					type: "number",
					config: definition.config.Z,
					default: definition.default.Z,
				},
			} as const satisfies BlockConfigTypes.Definitions;

			const control = this.add(new MultiConfigControl<typeof def>(this.gui.Control, configs, def));
			this.event.subscribe(control.configUpdated, (key, value) => {
				const prev = configs;
				this._submitted.Fire((configs = this.map(configs, (e, k) => withval(e, value[k], key))), prev);
			});
		}
	}
}
const Controls = {
	...ControlsSource,
	number: ControlsSource._number,
	string: ControlsSource._string,
	or: ControlsSource._or,
} as const satisfies {
	readonly [k in keyof BlockConfigTypes.Types]: new (
		config: BlockConfigTypes.Types[k]["config"],
		definition: ConfigTypeToDefinition<BlockConfigTypes.Types[k]>,
		...rest: never
	) => ConfigControl<k>;
};

interface ConfigControl<TKey extends keyof BlockConfigTypes.Types> extends Control<GuiObject> {
	readonly submitted: ReadonlyArgsSignal<
		[
			config: Readonly<Record<BlockUuid, BlockConfigTypes.Types[TKey]["config"]>>,
			prev: Readonly<Record<BlockUuid, BlockConfigTypes.Types[TKey]["config"]>>,
		]
	>;
}

type ConnectedValueControlDefinition = GuiButton;
class ConnectedValueControl extends ConfigValueControl<ConnectedValueControlDefinition, UnknownConfigType> {
	private readonly _travelToConnectedPressed = new Signal();
	readonly travelToConnectedPressed = this._travelToConnectedPressed.asReadonly();

	private readonly button;

	constructor(gui: ConfigPartDefinition<ConnectedValueControlDefinition>, name: string) {
		super(gui, name);

		this.button = this.add(new ButtonControl(gui.Control));
		this.button.activated.Connect(() => this._travelToConnectedPressed.Fire());
	}

	disableButton() {
		this.button.setInteractable(false);
	}
}

type MultiConfigControlDefinition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigTypes.Definitions, TKey extends keyof TDef & string> = (
	key: TKey,
	values: Readonly<Record<BlockUuid, TDef[TKey]["config"]>>,
) => void;

export class MultiConfigControl<
	TDef extends BlockConfigTypes.Definitions,
> extends Control<MultiConfigControlDefinition> {
	private readonly _travelToConnectedPressed = new ArgsSignal<[uuid: BlockUuid]>();
	readonly travelToConnectedPressed = this._travelToConnectedPressed.asReadonly();
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef & string>>();

	constructor(
		gui: MultiConfigControlDefinition,
		configs: Readonly<Record<BlockUuid, ConfigDefinitionsToConfig<keyof TDef, TDef>>>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
		block?: BlockModel,
	) {
		super(gui);

		for (const [id, def] of pairs(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				const connectedControl = this.add(new ConnectedValueControl(templates.connected(), def.displayName));

				if (block) {
					connectedControl.travelToConnectedPressed.Connect(() =>
						this._travelToConnectedPressed.Fire(
							BlockManager.manager.connections.get(block!)![id as BlockConnectionName].blockUuid,
						),
					);
				} else {
					connectedControl.disableButton();
				}

				continue;
			}

			const control = new Controls[def.type]({
				configs: Objects.fromEntries(
					Objects.entriesArray(configs).map((e) => [e[0], e[1][id]] as const),
				) as never,
				definition: def as never,
			});
			this.add(control);

			control.submitted.Connect((values) =>
				this.configUpdated.Fire(
					id as string,
					values as Readonly<Record<BlockUuid, TDef[keyof TDef]["config"]>>,
				),
			);
		}
	}
}
