import Config from "client/Config";
import Control from "client/base/Control";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigPartDefinition } from "../scenes/ConfigToolScene";

export default class ConfigPartControl<
	TControl extends Control<TDef>,
	TDef extends GuiObject,
	TValue extends ConfigValue | undefined,
> extends Control<ConfigPartDefinition<TDef>> {
	public readonly control: TControl & { value: ObservableValue<TValue> };

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { value: ObservableValue<TValue> },
		configs: readonly Config<ConfigValueTypes>[],
		definition: ConfigDefinition,
		key: string,
	) {
		super(gui);

		this.gui.HeadingLabel.Text = definition.displayName;
		this.control = ctor(this.gui.Control);
		this.control.value.set(configs[0].get(key) as TValue);

		this.add(this.control);
	}
}
