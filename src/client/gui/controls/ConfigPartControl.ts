import Control from "client/base/Control";
import { BlockConfigDefinition } from "shared/BlockConfigDefinitionRegistry";
import { JsonSerializablePrimitive } from "shared/_fixes_/Json";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigPartDefinition } from "../buildmode/tools/ConfigToolScene";

export default class ConfigPartControl<
	TControl extends Control<TDef>,
	TDef extends GuiObject,
	TValue extends JsonSerializablePrimitive,
> extends Control<ConfigPartDefinition<TDef>> {
	readonly control: TControl & { value: ObservableValue<TValue> };
	readonly key;
	readonly definition;

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { value: ObservableValue<TValue> },
		configs: Readonly<Record<string, unknown>>[],
		definition: BlockConfigDefinition,
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
