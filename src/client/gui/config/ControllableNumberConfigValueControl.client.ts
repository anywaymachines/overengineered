import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.ControllableNumber;
class ValueControl extends ConfigValueControl<GuiObject, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const def: Partial<Record<keyof BlockConfigTypes.ControllableNumber["config"], BlockConfigTypes.Definition>> = {
			value: {
				displayName: "Value",
				type: "clampedNumber",
				min: definition.min,
				max: definition.max,
				step: definition.step,
				default: definition.default,
				config: definition.config.value,
			},
			control: {
				displayName: "Thrust",
				type: "multikey",
				default: definition.config.control,
				config: definition.config.control,
				keyDefinitions: {
					add: {
						displayName: "+",
						type: "key",
						default: definition.config.control.add,
						config: definition.config.control.add,
					},
					sub: {
						displayName: "-",
						type: "key",
						default: definition.config.control.sub,
						config: definition.config.control.sub,
					},
				},
			},
		};

		const controlTemplate = this.asTemplate(this.gui.Control);
		const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
		this.event.subscribe(control.configUpdated, (key, values) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
		});
	}
}

configControlRegistry.set("controllableNumber", ValueControl);
