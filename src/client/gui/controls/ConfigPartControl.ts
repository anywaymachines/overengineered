import Control from "client/base/Control";
import { BlockConfig } from "client/blocks/BlockConfig";
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
		config: BlockConfig<ConfigValueTypes>,
		definition: ConfigDefinition,
		key: string,
		def: TValue,
	) {
		super(gui);

		this.gui.HeadingLabel.Text = definition.displayName;
		this.control = ctor(this.gui.Control);
		this.control.value.set((config.get(key) as TValue | undefined) ?? def);

		this.add(this.control);
	}
}
