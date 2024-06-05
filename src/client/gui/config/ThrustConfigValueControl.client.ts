import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";

type Type = BlockConfigTypes.Thrust;
class ValueControl extends ConfigValueControl<GuiObject, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
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
		this.event.subscribe(control.configUpdated, (key, values) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
		});
	}
}

configControlRegistry.set("thrust", ValueControl);
