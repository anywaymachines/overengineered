import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import TextBoxControl, { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import Signal from "shared/event/Signal";

class StringConfigValueControl extends ConfigValueControl<TextBoxControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.String["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.String["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.String>,
	) {
		super(configValueTemplateStorage.string(), definition.displayName);

		const control = this.add(new TextBoxControl(this.gui.Control));
		control.text.set(this.sameOrUndefined(configs) ?? "");

		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("string", StringConfigValueControl);
