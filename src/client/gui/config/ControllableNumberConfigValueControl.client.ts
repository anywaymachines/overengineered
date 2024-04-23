import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ControllableNumberConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.ControllableNumber["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.ControllableNumber["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.ControllableNumber>,
	) {
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
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((configs = this.map(configs, (c) => ({ ...c, [key]: value }))));
		});
	}
}

configControlRegistry.set("controllableNumber", ControllableNumberConfigValueControl);
