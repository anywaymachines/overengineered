import { Control } from "client/gui/Control";
import { NumberTextBoxControl, NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ConfigNumberControl extends Control<NumberTextBoxControlDefinition> {
	readonly submitted;

	constructor(gui: NumberTextBoxControlDefinition, def: number | undefined) {
		super(gui);

		const cb = this.add(new NumberTextBoxControl<true>(gui));
		this.submitted = cb.submitted;

		cb.value.set(def);
	}
}

type Type = BlockConfigTypes.Number;
class ValueControl extends ConfigValueControl<NumberTextBoxControlDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.number(), definition.displayName);

		const control = this.add(new ConfigNumberControl(this.gui.Control, this.sameOrUndefined(configs)));
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}

configControlRegistry.set("number", ValueControl);
