import { ColorChooser } from "client/gui/ColorChooser";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { ByteEditor } from "client/gui/controls/ByteEditorControl";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyOrStringChooserControl } from "client/gui/controls/KeyOrStringChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { Gui } from "client/gui/Gui";
import { MemoryEditorPopup } from "client/gui/popup/MemoryEditorPopup";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { ComponentChild } from "shared/component/ComponentChild";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ByteEditorDefinition } from "client/gui/controls/ByteEditorControl";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { KeyOrStringChooserControlDefinition } from "client/gui/controls/KeyOrStringChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import type { BlockConfigTypedPart } from "shared/blockLogic/BlockLogic";

type Keys = BlockConfigTypes2.TypeKeys;
type Types = BlockConfigTypes2.Types;
/** {@link BlockConfigTypes2.Types} without the `default` and `config` properties */
type MiniTypes = { readonly [k in Keys]: Omit<Types[k], "default" | "config"> };

type OfBlocks<T> = { readonly [k in BlockUuid]: T };

export type VisualBlockConfigDefinition = {
	readonly displayName: string;
	readonly types: { readonly [k in Keys]?: MiniTypes[k] };
	readonly configHidden?: boolean;
};
export type VisualBlockConfigDefinitions = { readonly [k in string]: VisualBlockConfigDefinition };

type ConfigPart<TKey extends Keys> = Types[TKey]["config"];
type ConfigParts<TKey extends Keys> = OfBlocks<ConfigPart<TKey>>;

type TypedConfigPart = BlockConfigTypedPart<Keys>;
type BlocksConfigPart = OfBlocks<TypedConfigPart>;
type BlocksConfig = OfBlocks<{ readonly [k in string]: TypedConfigPart }>;

/** Return the value if all of them are the same; Returns undefined otherwise */
const sameOrUndefined = <T>(configs: OfBlocks<T>, comparer?: (left: T, right: T) => boolean) => {
	let value: T | undefined;
	for (const [_, config] of pairs(configs)) {
		if (value !== undefined && !(comparer?.(value, config) ?? value === config)) {
			value = undefined;
			break;
		}

		value = config;
	}

	return value;
};

/** Map the config values, leaving the keys as is */
const map = <T, TOut extends defined>(
	configs: OfBlocks<T>,
	mapfunc: (value: T, key: BlockUuid) => TOut,
): OfBlocks<TOut> => {
	return asObject(asMap(configs).mapToMap((k, v) => $tuple(k, mapfunc(v, k))));
};

//

const template = Gui.getGameUI<{ Templates: { Config2: { Template: ConfigValueWrapperDefinition } } }>().Templates
	.Config2.Template;

namespace Controls {
	type SliderControlDefinition = GuiObject & {
		readonly TextBox: TextBox;
		readonly Control: GuiObject & {
			readonly Filled: GuiObject;
			readonly Knob: GuiObject;
		};
	};
	type ByteControlDefinition = GuiObject & {
		readonly Bottom: GuiObject & {
			readonly Buttons: ByteEditorDefinition["Buttons"] & defined;
		};
		readonly Top: GuiObject & {
			readonly TextBox: ByteEditorDefinition["TextBox"] & defined;
		};
	};

	export type Templates = {
		readonly Unset: ConfigValueDefinition<GuiObject>;

		readonly Checkbox: ConfigValueDefinition<CheckBoxControlDefinition>;
		readonly Number: ConfigValueDefinition<NumberTextBoxControlDefinition>;
		readonly Text: ConfigValueDefinition<TextBoxControlDefinition>;
		readonly Slider: ConfigValueDefinition<SliderControlDefinition>;
		readonly Byte: ConfigValueDefinition<ByteControlDefinition>;
		readonly ByteArray: ConfigValueDefinition<GuiButton>;
		readonly Key: ConfigValueDefinition<KeyOrStringChooserControlDefinition>;
		readonly Color: ConfigValueDefinition<ColorChooserDefinition>;
		readonly Multi: ConfigValueDefinition<GuiObject>;
	};
	type templates = {
		readonly [k in keyof Templates]: () => Templates[k];
	};
	export const templates: templates = {
		Unset: Control.asTemplateWithMemoryLeak(template.Content.Unset, true),

		Checkbox: Control.asTemplateWithMemoryLeak(template.Content.Checkbox, true),
		Number: Control.asTemplateWithMemoryLeak(template.Content.Number, true),
		Text: Control.asTemplateWithMemoryLeak(template.Content.Text, true),
		Slider: Control.asTemplateWithMemoryLeak(template.Content.Slider, true),
		Byte: Control.asTemplateWithMemoryLeak(template.Content.Byte, true),
		ByteArray: Control.asTemplateWithMemoryLeak(template.Content.ByteArray, true),
		Key: Control.asTemplateWithMemoryLeak(template.Content.Key, true),
		Color: Control.asTemplateWithMemoryLeak(template.Content.Color, true),
		Multi: Control.asTemplateWithMemoryLeak(template.Content.Multi, true),
	};

	namespace Controls {
		const addSingleTypeWrapper = <T extends Base<GuiObject>>(parent: Base<GuiObject>, control: T) => {
			const wrapper = new ConfigValueWrapper(template.Clone());
			wrapper.dropdown.hide();
			wrapper.content.set(control);

			wrapper.instance.Parent = parent.control;
			parent.add(wrapper);
			return $tuple(wrapper, control);
		};
		const addSingleTypeWrapperAuto = <TKey extends Keys>(
			parent: Base<GuiObject>,
			key: TKey,
			displayName: string,
			def: MiniTypes[TKey],
			configs: ConfigParts<TKey>,
		) => {
			const ctor = controls[key];
			if (!ctor) throw `No ctor for block config visual type ${key}`;

			const control = new ctor(templates, def, configs);
			control.instance.HeadingLabel.Text = displayName;

			const [wrapper] = addSingleTypeWrapper(parent, control);
			wrapper.typeColor.set(BlockWireManager.typeGroups[BlockWireManager.groups[key]].color);

			return $tuple(wrapper, control as Base<GuiObject> & Submittable<TKey>);
		};

		type Submittable<TKey extends Keys> = {
			readonly submitted: ReadonlyArgsSignal<[value: ConfigParts<TKey>]>;
		};
		abstract class Base<T extends GuiObject> extends Control<ConfigValueDefinition<T>> {
			readonly control: T;

			constructor(gui: ConfigValueDefinition<T>) {
				super(gui);
				this.control = gui.Control;
			}
		}

		export class unset extends Base<GuiObject> {
			constructor(templates: templates) {
				super(templates.Unset());
			}
		}
		export class bool extends Base<CheckBoxControlDefinition> {
			readonly submitted = new ArgsSignal<[value: ConfigParts<"bool">]>();

			constructor(templates: templates, definition: MiniTypes["bool"], config: ConfigParts<"bool">) {
				super(templates.Checkbox());

				const control = this.add(new CheckBoxControl(this.control));
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class _number extends Base<NumberTextBoxControlDefinition> {
			readonly submitted = new ArgsSignal<[value: ConfigParts<"number">]>();

			constructor(templates: templates, definition: MiniTypes["number"], config: ConfigParts<"number">) {
				super(templates.Number());

				const control = this.add(new NumberTextBoxControl<true>(this.control));
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class _string extends Base<TextBoxControlDefinition> {
			constructor(templates: templates, definition: MiniTypes["string"], config: ConfigParts<"string">) {
				super(templates.Text());

				const control = this.add(new TextBoxControl(this.control));
				control.text.set(sameOrUndefined(config) ?? "");
			}
		}
		export class clampedNumber extends Base<SliderControlDefinition> {
			constructor(
				templates: templates,
				definition: MiniTypes["clampedNumber"],
				config: ConfigParts<"clampedNumber">,
			) {
				super(templates.Slider());

				const control = this.add(
					new SliderControl<true>(this.control, definition.min, definition.max, definition.step, {
						Knob: this.gui.Control.Control.Knob,
						Filled: this.gui.Control.Control.Filled,
					}),
				);
				control.value.set(sameOrUndefined(config));
			}
		}
		export class byte extends Base<ByteControlDefinition> {
			constructor(templates: templates, definition: MiniTypes["byte"], config: ConfigParts<"byte">) {
				super(templates.Byte());

				const control = this.add(
					new ByteEditor(this.control, {
						Buttons: this.gui.Control.Bottom.Buttons,
						TextBox: this.gui.Control.Top.TextBox,
					}),
				);
				control.value.set(sameOrUndefined(config) ?? 0);
			}
		}
		export class key extends Base<KeyOrStringChooserControlDefinition> {
			constructor(templates: templates, definition: MiniTypes["key"], config: ConfigParts<"key">) {
				super(templates.Key());

				const control = this.add(new KeyOrStringChooserControl<true>(this.control));
				control.value.set(sameOrUndefined(config));
			}
		}
		export class bytearray extends Base<GuiButton> {
			constructor(templates: templates, definition: MiniTypes["bytearray"], config: ConfigParts<"bytearray">) {
				super(templates.ByteArray());

				const value = sameOrUndefined(config, (left, right) => {
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
					new ButtonControl(this.control, () => {
						MemoryEditorPopup.showPopup(definition.lengthLimit, [...(value ?? [])], (newval) => {});
					}),
				);

				if (!value) {
					control.setInteractable(false);
				}
			}
		}
		export class color extends Base<ColorChooserDefinition> {
			constructor(templates: templates, definition: MiniTypes["color"], config: ConfigParts<"color">) {
				super(templates.Color());

				const control = this.add(new ColorChooser(this.control));
				control.value.set(sameOrUndefined(config) ?? Colors.white);
			}
		}

		export class keybool extends Base<GuiObject> {
			constructor(templates: templates, definition: MiniTypes["keybool"], config: ConfigParts<"keybool">) {
				super(templates.Multi());

				addSingleTypeWrapperAuto(
					this,
					"key",
					"Key",
					{},
					map(config, (c) => c.key),
				);

				if (definition.canBeSwitch) {
					addSingleTypeWrapperAuto(
						this,
						"bool",
						"Switch",
						{},
						map(config, (c) => c.switch),
					);
				}

				if (definition.canBeReversed) {
					addSingleTypeWrapperAuto(
						this,
						"bool",
						"Reversed",
						{},
						map(config, (c) => c.reversed),
					);
				}
			}
		}
		export class vector3 extends Base<GuiObject> {
			readonly submitted = new ArgsSignal<[value: ConfigParts<"vector3">]>();

			constructor(templates: templates, definition: MiniTypes["vector3"], config: ConfigParts<"vector3">) {
				super(templates.Multi());

				const [, cx] = addSingleTypeWrapperAuto(
					this,
					"number",
					"X",
					{},
					map(config, (c) => c.X),
				);
				const [, cy] = addSingleTypeWrapperAuto(
					this,
					"number",
					"Y",
					{},
					map(config, (c) => c.Y),
				);
				const [, cz] = addSingleTypeWrapperAuto(
					this,
					"number",
					"Z",
					{},
					map(config, (c) => c.Z),
				);

				const vec = (parts: OfBlocks<number>, axis: "X" | "Y" | "Z") => {
					if (axis === "X") return map(config, (c, uuid) => new Vector3(parts[uuid], c.Y, c.Z));
					if (axis === "Y") return map(config, (c, uuid) => new Vector3(c.X, parts[uuid], c.Z));
					if (axis === "Z") return map(config, (c, uuid) => new Vector3(c.X, c.Y, parts[uuid]));

					throw "what";
				};

				cx.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "X"))));
				cy.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Y"))));
				cz.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Z"))));
			}
		}
		export class motorRotationSpeed extends Base<GuiObject> {
			constructor(
				templates: templates,
				definition: MiniTypes["motorRotationSpeed"],
				config: ConfigParts<"motorRotationSpeed">,
			) {
				super(templates.Multi());

				addMultiKeyControls(this, [
					{ displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
					{ displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
				]);
				addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Max speed",
					{ min: 0, max: definition.maxSpeed, step: 0.01 },
					map(config, (c) => c.speed),
				);
				addSingleTypeWrapperAuto(
					this,
					"bool",
					"Switch mode",
					{},
					map(config, (c) => c.switchmode),
				);
			}
		}
		export class servoMotorAngle extends Base<GuiObject> {
			constructor(
				templates: templates,
				definition: MiniTypes["servoMotorAngle"],
				config: ConfigParts<"servoMotorAngle">,
			) {
				super(templates.Multi());

				addMultiKeyControls(this, [
					{ displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
					{ displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
				]);
				addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Angle",
					{ min: definition.minAngle, max: definition.maxAngle, step: 0.01 },
					map(config, (c) => c.angle),
				);
				addSingleTypeWrapperAuto(
					this,
					"bool",
					"Switch mode",
					{},
					map(config, (c) => c.switchmode),
				);
			}
		}
		export class thrust extends Base<GuiObject> {
			constructor(templates: templates, definition: MiniTypes["thrust"], config: ConfigParts<"thrust">) {
				super(templates.Multi());

				addMultiKeyControls(this, [
					{ displayName: "+", definition: {}, config: map(config, (c) => c.thrust.add) },
					{ displayName: "-", definition: {}, config: map(config, (c) => c.thrust.sub) },
				]);

				if (definition.canBeSwitch) {
					addSingleTypeWrapperAuto(
						this,
						"bool",
						"Switch mode",
						{},
						map(config, (c) => c.switchmode),
					);
				}
			}
		}
		export class controllableNumber extends Base<GuiObject> {
			constructor(
				templates: templates,
				definition: MiniTypes["controllableNumber"],
				config: ConfigParts<"controllableNumber">,
			) {
				super(templates.Multi());

				addMultiKeyControls(this, [
					{ displayName: "+", definition: {}, config: map(config, (c) => c.control.add) },
					{ displayName: "-", definition: {}, config: map(config, (c) => c.control.sub) },
				]);
				addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Value",
					definition,
					map(config, (c) => c.value),
				);
			}
		}

		function addMultiKeyControls(
			parent: Base<GuiObject>,
			stuffs: readonly {
				readonly displayName: string;
				readonly definition: MiniTypes["key"];
				readonly config: ConfigParts<"key">;
			}[],
		): void {
			for (const { displayName, definition, config } of stuffs) {
				const [wrapper, control] = addSingleTypeWrapperAuto(parent, "key", displayName, definition, config);
			}

			// const list = this.add(new DictionaryControl<GuiObject, string, key>(this.gui.Control));
			// for (const [name, _] of pairs(definition.default)) {
			// 	const cfgs = asObject(asMap(configs).mapToMap((uuid, config) => $tuple(uuid, config[name])));

			// 	const control = new key({
			// 		configs: cfgs,
			// 		definition: definition.keyDefinitions[name],
			// 	});
			// 	list.keyedChildren.add(name, control);

			// 	this.event.subscribe(control.submitted, (value, prev) => {
			// 		const changed: (keyof (typeof configs)[BlockUuid])[] = [name];
			// 		const newvalue = Objects.firstValue(value)!;
			// 		const prevval = asMap(prev).findValue((p) => p !== newvalue);
			// 		if (prevval === undefined) {
			// 			throw "what";
			// 		}

			// 		for (const [key, child] of list.keyedChildren.getAll()) {
			// 			if (child === control) continue;

			// 			for (const [, value] of pairs(child.values.get())) {
			// 				if (newvalue === value) {
			// 					child.values.set(this.map(configs, () => prevval));
			// 					print("setting mega cvhild values", JSON.serialize(child.values.get()));
			// 					changed.push(key);
			// 					break;
			// 				}
			// 			}
			// 		}

			// 		const thisprev = configs;
			// 		const update = Objects.fromEntries(
			// 			changed.map((c) => [c, Objects.firstValue(list.keyedChildren.get(c)!.values.get()!)!] as const),
			// 		);
			// 		configs = this.map(configs, (c) => ({ ...c, ...update }));
			// 		this._submitted.Fire(configs, thisprev);
			// 	});
			// }
		}

		export type controls = {
			readonly [k in Keys]?: new (
				templates: templates,
				definition: MiniTypes[k],
				config: ConfigParts<k>,
			) => Base<GuiObject>;
		};
		export type genericControls = {
			readonly [k in Keys]?: new (
				templates: templates,
				definition: MiniTypes[Keys],
				config: ConfigParts<Keys>,
			) => Base<GuiObject>;
		};
	}

	export const controls = {
		...Controls,
		number: Controls._number,
		string: Controls._string,
	} satisfies Controls.controls as Controls.genericControls;
}

type ConfigValueDefinition<T> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type ConfigValueWrapperDefinition = GuiObject & {
	readonly TypeLine: Frame;
	readonly Content: GuiObject & Controls.Templates & { readonly Dropdown: DropdownListDefinition };
};
type m = "[multi]";
type mk = Keys | m;

class ConfigValueWrapper extends Control<ConfigValueWrapperDefinition> {
	readonly typeColor = new ObservableValue<Color3>(Colors.white);
	readonly dropdown;
	readonly content;

	constructor(gui: ConfigValueWrapperDefinition) {
		super(gui);

		this.event.subscribeObservable(this.typeColor, (color) => (gui.TypeLine.BackgroundColor3 = color), true);

		this.dropdown = this.add(new DropdownList<mk>(gui.Content.Dropdown));

		this.content = new ComponentChild<Control>(this);
		this.content.childSet.Connect((child) => {
			if (!child) return;
			child.instance.Parent = gui.Content;
		});
	}
}

class ConfigAutoValueWrapper extends Control<ConfigValueWrapperDefinition> {
	readonly submitted = new ArgsSignal<[config: TypedConfigPart]>();

	constructor(gui: ConfigValueWrapperDefinition, definition: VisualBlockConfigDefinition, configs: BlocksConfigPart) {
		super(gui);

		const control = this.add(new ConfigValueWrapper(gui));
		control.dropdown.addItem("unset");

		const selectedType = new ObservableValue<mk>("unset");
		selectedType.subscribe((t) => control.dropdown.selectedItem.set(t), true);
		control.dropdown.selectedItem.subscribe((t) => t && selectedType.set(t));

		for (const [k, type] of pairs(definition.types)) {
			control.dropdown.addItem(k);
		}

		if (asMap(definition.types).size() === 1) {
			// if there is only one definition type

			const key = next(definition.types)[0];
			selectedType.set(key);
			control.dropdown.hide();
		} else {
			// if there is multiple definition types

			const types = asSet(asMap(configs).mapToMap((k, v) => $tuple(v.type, true as const)));
			if (types.size() === 1) {
				// if every config has the same type set
				selectedType.set(next(types)[0]);
			} else {
				// if configs have different types set
				selectedType.set("[multi]");
			}
		}

		this.event.subscribeObservable(
			selectedType,
			(selectedType) => {
				control.content.set(undefined);

				if (!selectedType) return;
				if (selectedType === "[multi]") selectedType = "unset";
				if (selectedType !== "unset" && !(selectedType in definition.types)) return;

				control.typeColor.set(BlockWireManager.typeGroups[BlockWireManager.groups[selectedType]].color);

				const ctor = Controls.controls[selectedType];
				if (!ctor) return;

				let cfgcontrol: InstanceType<typeof ctor> | undefined = undefined;

				if (selectedType === "unset") {
					cfgcontrol = new ctor(Controls.templates, { config: undefined as never }, {});
				} else {
					const def = definition.types[selectedType];
					if (!def) return;

					const partialConfigs = map(configs, (c) => c.config);
					cfgcontrol = new ctor(Controls.templates, def, partialConfigs);
				}

				cfgcontrol.instance.HeadingLabel.Text = definition.displayName;

				if ("submitted" in cfgcontrol) {
					type t = { readonly submitted?: ArgsSignal<[value: ConfigPart<Keys>]> };
					(cfgcontrol as t).submitted?.Connect((v) => this.submitted.Fire({ type: selectedType, config: v }));
				}

				control.content.set(cfgcontrol);
			},
			true,
		);
	}
}

export class MultiBlockConfigControl extends Control {
	constructor(gui: GuiObject, definitions: VisualBlockConfigDefinitions, configs: BlocksConfig) {
		super(gui);

		for (const [k, definition] of pairs(definitions)) {
			const lconfigs = map(configs, (c) => c[k]);
			const wrapper = this.add(new ConfigAutoValueWrapper(template.Clone(), definition, lconfigs));
		}
	}
}
