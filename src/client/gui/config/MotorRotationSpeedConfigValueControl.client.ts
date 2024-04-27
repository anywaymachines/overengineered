import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class MotorRotationSpeedConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.MotorRotationSpeed["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.MotorRotationSpeed["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.MotorRotationSpeed>,
	) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const def: Partial<Record<keyof BlockConfigTypes.MotorRotationSpeed["config"], BlockConfigTypes.Definition>> = {
			rotation: {
				displayName: "Rotation",
				type: "multikey",
				config: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				default: {
					add: "R" as KeyCode,
					sub: "F" as KeyCode,
				},
				keyDefinitions: {
					add: {
						displayName: "+",
						type: "key",
						default: "R" as KeyCode,
						config: "R" as KeyCode,
					},
					sub: {
						displayName: "-",
						type: "key",
						default: "F" as KeyCode,
						config: "F" as KeyCode,
					},
				},
			},
			speed: {
				displayName: "Max. speed",
				type: "clampedNumber",
				min: 0,
				max: 50,
				step: 0.01,
				default: 15 as number,
				config: 0 as number,
			},
			switchmode: {
				displayName: "Switch",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			},
		};

		const controlTemplate = this.asTemplate(this.gui.Control);
		const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((configs = this.map(configs, (c) => ({ ...c, [key]: value }))));
		});
	}
}

configControlRegistry.set("motorRotationSpeed", MotorRotationSpeedConfigValueControl);
