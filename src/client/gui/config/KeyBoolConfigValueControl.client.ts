import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.KeyBool;
class ValueControl extends ConfigValueControl<GuiObject, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.multi(), definition.displayName);
		const controlTemplate = this.asTemplate(this.gui.Control);

		const def: Partial<Record<keyof BlockConfigTypes.KeyBool["config"], BlockConfigTypes.Definition>> = {
			key: {
				displayName: "Key",
				type: "key",
				config: definition.config.key,
				default: definition.config.key,
			},
		};
		if (definition.canBeSwitch) {
			def.switch = {
				displayName: "Toggle mode",
				type: "bool",
				config: definition.config.switch,
				default: definition.config.switch,
			};
		}
		if (definition.canBeReversed) {
			def.reversed = {
				displayName: "Inverted",
				type: "bool",
				config: definition.config.reversed,
				default: definition.config.reversed,
			};
		}

		const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
		this.event.subscribe(control.configUpdated, (key, values) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, (c, k) => ({ ...c, [key]: values[k] }))), prev);
		});
	}
}

configControlRegistry.set("keybool", ValueControl);
