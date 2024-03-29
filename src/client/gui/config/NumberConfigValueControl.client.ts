import Control from "client/gui/Control";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import Signal from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ConfigNumberControl extends Control<NumberTextBoxControlDefinition> {
	readonly submitted;

	constructor(gui: NumberTextBoxControlDefinition, def: number | undefined) {
		super(gui);

		const cb = this.add(new NumberTextBoxControl<number | undefined>(gui));
		this.submitted = cb.submitted;

		cb.value.set(def);
		// TODO: def
	}
}

class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(config: Readonly<Record<BlockUuid, BlockConfigTypes.Number["config"]>>) => void>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Number["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Number>,
	) {
		super(configValueTemplateStorage.number(), definition.displayName);

		const control = this.add(new ConfigNumberControl(this.gui.Control, this.sameOrUndefined(configs)));
		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("number", NumberConfigValueControl);
