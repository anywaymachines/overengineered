import { Control } from "client/gui/Control";
import type { ConfigPartDefinition } from "client/gui/popup/SettingsPopup";
import type { ObservableValue } from "shared/event/ObservableValue";

export class ConfigPartControl<TControl extends Control<TDef>, TDef extends GuiObject, TValue> extends Control<
	ConfigPartDefinition<TDef>
> {
	readonly control: TControl & { value: ObservableValue<TValue> };
	readonly key;
	readonly definition;

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { readonly value: ObservableValue<TValue> },
		configs: readonly Readonly<Record<string, unknown>>[],
		definition: ConfigTypeToDefinition<UnknownConfigType>,
		key: string,
	) {
		super(gui);
		this.key = key;
		this.definition = definition;

		this.gui.HeadingLabel.Text = definition.displayName;
		this.control = ctor(this.gui.Control);
		this.control.value.set(configs[0][key] as TValue);

		this.add(this.control);
	}
}
