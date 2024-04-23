import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class KeyBoolConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.KeyBool["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.KeyBool["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.KeyBool>,
	) {
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
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((configs = this.map(configs, (c) => ({ ...c, [key]: value }))));
		});
	}
}

configControlRegistry.set("keybool", KeyBoolConfigValueControl);
