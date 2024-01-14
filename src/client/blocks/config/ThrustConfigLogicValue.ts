import { KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ThrustConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["thrust"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigDefinitionRegistry["thrust"],
		connected: boolean,
		controlsEnabled: ReadonlyObservableValue<boolean>,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(0);
			let torque = 0;
			let movingUp = false;
			let movingDown = false;

			const update = () => this.value.set(torque);
			const start = (up: boolean) => {
				spawn(() => {
					while (up ? movingUp : movingDown) {
						const p = up ? 1 : -1;
						if (torque + p >= 0 && torque + p <= 100) {
							torque += p;
							update();
						}

						wait(0.05);
					}
				});
			};

			const controller = new KeyPressingDefinitionsController({
				thrustAdd: {
					key: config.thrust_add,
					conflicts: "down",
					keyDown: () => {
						if (movingUp) return;

						if (definition.canBeSwitch && config.switchmode) {
							torque = 100;
							update();
						} else {
							movingUp = true;
							start(true);
						}
					},
					keyUp: () => {
						movingUp = false;
					},
				},
				thrustSub: {
					key: config.thrust_sub,
					conflicts: "up",
					keyDown: () => {
						if (movingDown) return;

						if (definition.canBeSwitch && config.switchmode) {
							torque = 0;
							update();
						} else {
							movingDown = true;
							start(false);
						}
					},
					keyUp: () => {
						movingDown = false;
					},
				},
			});

			this.add(controller);
			this.event.subscribeObservable(controlsEnabled, (enabled) =>
				enabled ? controller.enable() : controller.disable(),
			);
			this.event.subscribeObservable(controlsEnabled, (enabled) => print("enabled? " + enabled));
		}
	}

	protected createObservable(): ObservableValue<number> {
		return new NumberObservableValue(this.definition.default, 0, 100, 0.01);
	}
}
