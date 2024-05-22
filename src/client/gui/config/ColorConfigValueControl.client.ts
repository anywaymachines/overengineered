import { ColorChooser } from "client/gui/ColorChooser";
import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";

type Type = BlockConfigTypes.Color;
class ValueControl extends ConfigValueControl<ColorChooserDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.color(), definition.displayName);

		const control = this.add(new ColorChooser(this.gui.Control));
		control.value.set(this.sameOrUndefined(configs) ?? Color3.fromRGB(255, 255, 255));

		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}

configControlRegistry.set("color", ValueControl);
