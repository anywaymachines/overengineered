import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ThrustConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<(config: Readonly<Record<BlockUuid, BlockConfigTypes.Thrust["config"]>>) => void>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Thrust["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Thrust>,
	) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const def: Partial<Record<keyof BlockConfigTypes.Thrust["config"], BlockConfigTypes.Definition>> = {
			thrust: {
				displayName: "Thrust",
				type: "multikey",
				default: {
					add: "W" as KeyCode,
					sub: "S" as KeyCode,
				},
				config: {
					add: "W" as KeyCode,
					sub: "S" as KeyCode,
				},
				keyDefinitions: {
					add: {
						displayName: "+",
						type: "key",
						default: "W",
						config: "W",
					},
					sub: {
						displayName: "-",
						type: "key",
						default: "S",
						config: "S",
					},
				},
			},
		};

		if (definition.canBeSwitch) {
			def.switchmode = {
				displayName: "Toggle Mode",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			};
		}

		const controlTemplate = this.asTemplate(this.gui.Control);
		const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((configs = this.map(configs, (c) => ({ ...c, [key]: value }))));
		});
	}
}

configControlRegistry.set("thrust", ThrustConfigValueControl);
