import { Control } from "client/gui/Control";
import { SliderControl, SliderControlDefinition } from "client/gui/controls/SliderControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
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

class ClampedNumberConfigValueControl extends ConfigValueControl<SliderControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.ClampedNumber["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.ClampedNumber["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.ClampedNumber>,
	) {
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
		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("clampedNumber", ClampedNumberConfigValueControl);
