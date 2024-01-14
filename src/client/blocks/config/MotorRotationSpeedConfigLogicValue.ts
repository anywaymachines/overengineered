import { KeyDefinitions, KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MotorRotationSpeedConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["motorRotationSpeed"]
> {
	constructor(
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigDefinitionRegistry["motorRotationSpeed"],
		connected: boolean,
		controlsEnabled: ReadonlyObservableValue<boolean>,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(0);

			const def = {
				add: {
					key: config.rotate_add,
					conflicts: "sub",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(config.speed);
						} else {
							this.value.set(this.value.get() === config.speed ? 0 : config.speed);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
				sub: {
					key: config.rotate_sub,
					conflicts: "add",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(-config.speed);
						} else {
							this.value.set(this.value.get() === -config.speed ? 0 : -config.speed);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			const controller = this.added(new KeyPressingDefinitionsController(def));
			this.event.subscribeObservable(controlsEnabled, (enabled) =>
				enabled ? controller.enable() : controller.disable(),
			);
		}
	}
}
