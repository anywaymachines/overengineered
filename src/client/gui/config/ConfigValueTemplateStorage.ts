import GuiController from "client/controller/GuiController";
import Control from "client/gui/Control";
import { ConfigControlDefinition } from "../buildmode/ConfigControl";
import { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import { KeyChooserControlDefinition } from "../controls/KeyChooserControl";
import { NumberTextBoxControlDefinition } from "../controls/NumberTextBoxControl";
import { SliderControlDefinition } from "../controls/SliderControl";
import { TextBoxControlDefinition } from "../controls/TextBoxControl";
import { ToggleControlDefinition } from "../controls/ToggleControl";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type Templates = {
	readonly ConnectedTemplate: ConfigPartDefinition<GuiObject>;
	readonly CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
	readonly ToggleTemplate: ConfigPartDefinition<ToggleControlDefinition>;
	readonly KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
	readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	readonly StringTemplate: ConfigPartDefinition<TextBoxControlDefinition>;
	readonly MultiTemplate: ConfigPartDefinition<ConfigControlDefinition>;
};
const templates = GuiController.getGameUI<{ Templates: { Configuration: Templates } }>().Templates.Configuration;

export const configValueTemplateStorage = {
	connected: Control.asTemplate(templates.ConnectedTemplate, false),
	toggle: Control.asTemplate(templates.ToggleTemplate, false),
	checkbox: Control.asTemplate(templates.CheckboxTemplate, false),
	key: Control.asTemplate(templates.KeyTemplate, false),
	slider: Control.asTemplate(templates.SliderTemplate, false),
	number: Control.asTemplate(templates.NumberTemplate, false),
	string: Control.asTemplate(templates.StringTemplate, false),
	multi: Control.asTemplate(templates.MultiTemplate, false),
} as const;

export type ConfigValueTemplateStorage = typeof configValueTemplateStorage;
