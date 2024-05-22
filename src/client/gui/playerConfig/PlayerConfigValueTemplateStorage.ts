import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type Templates = {
	readonly ToggleTemplate: ConfigPartDefinition<ToggleControlDefinition>;
	readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	readonly MultiTemplate: ConfigPartDefinition<GuiObject>;
	readonly DropdownTemplate: ConfigPartDefinition<DropdownListDefinition>;
};

const templates = Gui.getGameUI<{ Templates: { PlayerConfig: Templates } }>().Templates.PlayerConfig;

export const playerConfigValueTemplateStorage = {
	toggle: Control.asTemplateWithMemoryLeak(templates.ToggleTemplate, false),
	number: Control.asTemplateWithMemoryLeak(templates.NumberTemplate, false),
	slider: Control.asTemplateWithMemoryLeak(templates.SliderTemplate, false),
	multi: Control.asTemplateWithMemoryLeak(templates.MultiTemplate, false),
	dropdown: Control.asTemplateWithMemoryLeak(templates.DropdownTemplate, false),
} as const;
export type PlayerConfigValueTemplateStorage = typeof playerConfigValueTemplateStorage;
