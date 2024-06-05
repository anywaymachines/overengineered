import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";

type Type = BlockConfigTypes.ServoMotorAngle;
class ValueControl extends ConfigValueControl<GuiObject, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
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
				min: -180,
				max: 180,
				step: 0.01,
				config: -180 as number,
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

configControlRegistry.set("servoMotorAngle", ValueControl);
