import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import { SliderControlDefinition } from "client/gui/controls/SliderControl";
import { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type Templates = {
	readonly ConnectedTemplate: ConfigPartDefinition<GuiObject>;
	readonly CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	readonly KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	readonly StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
	readonly MultiTemplate: ConfigPartDefinition<ConfigControlDefinition>;
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
} as const;
export type ConfigValueTemplateStorage = typeof configValueTemplateStorage;
