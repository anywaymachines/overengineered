import Control from "client/base/Control";
import BlockConfigWithLogic from "client/blocks/config/BlockConfigWithLogic";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigPartDefinition } from "../buildmode/tools/ConfigToolScene";

export default class ConfigPartControl<
	TControl extends Control<TDef>,
	TDef extends GuiObject,
	TValue extends ConfigValue | undefined,
> extends Control<ConfigPartDefinition<TDef>> {
	readonly control: TControl & { value: ObservableValue<TValue> };
	readonly key;
	readonly definition;

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { value: ObservableValue<TValue> },
		configs: readonly BlockConfigWithLogic<{ input: ConfigDefinitions; output: {} }>[],
		definition: ConfigDefinition,
		key: string,
	) {
		super(gui);
		this.key = key;
		this.definition = definition;

		this.gui.HeadingLabel.Text = definition.displayName;
		this.control = ctor(this.gui.Control);
		this.control.value.set(configs[0].inputs[key].value.get() as TValue);

		this.add(this.control);
	}
}
