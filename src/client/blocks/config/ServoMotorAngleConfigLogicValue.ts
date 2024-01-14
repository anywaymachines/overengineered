import { KeyDefinitions, KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ServoMotorAngleConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["servoMotorAngle"]
> {
	constructor(
		config: BlockConfigDefinitionRegistry["servoMotorAngle"]["config"],
		definition: BlockConfigDefinitionRegistry["servoMotorAngle"],
		connected: boolean,
		controlsEnabled: ReadonlyObservableValue<boolean>,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(0);

			const def = {
				thrustAdd: {
					key: config.rotate_add,
					conflicts: "thrustSub",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(config.angle);
						} else {
							this.value.set(this.value.get() === config.angle ? 0 : config.angle);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
				thrustSub: {
					key: config.rotate_sub,
					conflicts: "thrustAdd",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(-config.angle);
						} else {
							this.value.set(this.value.get() === -config.angle ? 0 : -config.angle);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
			} as const satisfies KeyDefinitions<"thrustAdd" | "thrustSub">;

			const controller = this.added(new KeyPressingDefinitionsController(def));
			this.event.subscribeObservable(controlsEnabled, (enabled) =>
				enabled ? controller.enable() : controller.disable(),
			);
		}
	}
}
