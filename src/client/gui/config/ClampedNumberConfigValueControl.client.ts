import { Control } from "client/gui/Control";
import { SliderControl, SliderControlDefinition } from "client/gui/controls/SliderControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ClampedConfigNumberControl extends Control<SliderControlDefinition> {
	readonly submitted;

	constructor(gui: SliderControlDefinition, def: number | undefined, min: number, max: number, step: number) {
		super(gui);

		const cb = this.add(new SliderControl<true>(gui, min, max, step));
		this.submitted = cb.submitted;

		cb.value.set(def);
	}
}

type Type = BlockConfigTypes.ClampedNumber;
class ValueControl extends ConfigValueControl<SliderControlDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.slider(), definition.displayName);

		const control = this.add(
			new ClampedConfigNumberControl(
				this.gui.Control,
				this.sameOrUndefined(configs),
				definition.min,
				definition.max,
				definition.step,
			),
		);
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}

configControlRegistry.set("clampedNumber", ValueControl);
