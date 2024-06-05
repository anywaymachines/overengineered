import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";
import type { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";

type Type = BlockConfigTypes.String;
class ValueControl extends ConfigValueControl<TextBoxControlDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.string(), definition.displayName);

		const control = this.add(new TextBoxControl(this.gui.Control));
		control.text.set(this.sameOrUndefined(configs) ?? "");

		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}

configControlRegistry.set("string", ValueControl);
