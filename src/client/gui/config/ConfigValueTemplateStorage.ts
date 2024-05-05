import { type ColorChooserDefinition } from "client/gui/ColorChooser";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { type OrConfigControlDefinition } from "client/gui/config/OrConfigValueControl.client";
import { ByteEditorDefinition } from "client/gui/controls/ByteEditorControl";
import { type CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import { type KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import { type NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import { type SliderControlDefinition } from "client/gui/controls/SliderControl";
import { type TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type Templates = {
	readonly ConnectedTemplate: ConfigPartDefinition<GuiButton>;
	readonly CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	readonly KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	readonly StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
	readonly MultiTemplate: ConfigPartDefinition<GuiObject>;
	readonly MultiMultiTemplate: ConfigPartDefinition<OrConfigControlDefinition>;
	readonly ColorTemplate: ConfigPartDefinition<ColorChooserDefinition>;
	readonly ByteTemplate: ConfigPartDefinition<ByteEditorDefinition>;
	readonly ByteArrayTemplate: ConfigPartDefinition<GuiButton>;
};
const templates = Gui.getGameUI<{ Templates: { Config: Templates } }>().Templates.Config;

export const configValueTemplateStorage = {
	connected: Control.asTemplateWithMemoryLeak(templates.ConnectedTemplate, false),
	checkbox: Control.asTemplateWithMemoryLeak(templates.CheckboxTemplate, false),
	key: Control.asTemplateWithMemoryLeak(templates.KeyTemplate, false),
	slider: Control.asTemplateWithMemoryLeak(templates.SliderTemplate, false),
	number: Control.asTemplateWithMemoryLeak(templates.NumberTemplate, false),
	string: Control.asTemplateWithMemoryLeak(templates.StringTemplate, false),
	multi: Control.asTemplateWithMemoryLeak(templates.MultiTemplate, false),
	multiMulti: Control.asTemplateWithMemoryLeak(templates.MultiMultiTemplate, false),
	color: Control.asTemplateWithMemoryLeak(templates.ColorTemplate, false),
	byte: Control.asTemplateWithMemoryLeak(templates.ByteTemplate, false),
	bytearray: Control.asTemplateWithMemoryLeak(templates.ByteArrayTemplate, false),
} as const;
export type ConfigValueTemplateStorage = typeof configValueTemplateStorage;
