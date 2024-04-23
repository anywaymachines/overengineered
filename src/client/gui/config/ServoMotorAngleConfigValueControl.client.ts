import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ServoMotorAngleRotationSpeedConfigValueControl extends ConfigValueControl<ConfigControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.ServoMotorAngle["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.ServoMotorAngle["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.ServoMotorAngle>,
	) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const def: Partial<Record<keyof BlockConfigTypes.ServoMotorAngle["config"], BlockConfigTypes.Definition>> = {
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
			switchmode: {
				displayName: "Switch",
				type: "bool",
				default: false as boolean,
				config: false as boolean,
			},
			angle: {
				displayName: "Angle",
				type: "clampedNumber",
				default: -180 as number,
				min: 0,
				max: 359,
				step: 0.01,
				config: -180 as number,
			},
		};

		const controlTemplate = this.asTemplate(this.gui.Control);
		const control = this.add(new MultiConfigControl(controlTemplate(), configs, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((configs = this.map(configs, (c) => ({ ...c, [key]: value }))));
		});
	}
}

configControlRegistry.set("servoMotorAngle", ServoMotorAngleRotationSpeedConfigValueControl);
