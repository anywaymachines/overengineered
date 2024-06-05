import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";

type Type = BlockConfigTypes.Bool;
class ValueControl extends ConfigValueControl<CheckBoxControlDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.checkbox(), definition.displayName);

		const control = this.add(new CheckBoxControl(this.gui.Control));
		control.value.set(this.sameOrUndefined(configs));
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}

configControlRegistry.set("bool", ValueControl);
