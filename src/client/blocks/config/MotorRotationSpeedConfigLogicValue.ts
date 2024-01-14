import { KeyPressingDefinitionsController } from "client/base/KeyPressingController";
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

			let isIncreasing = false;
			let isDecreasing = false;

			const update = () => {
				const isMoving = math.abs(this.value.get()) === math.abs(config.speed);

				// Switch logic
				if (config.switchmode) {
					if (isIncreasing) {
						// Increase
						if (isMoving) {
							this.value.set(0);
							return;
						}
						this.value.set(config.speed);
					}

					if (isDecreasing) {
						// Decrease
						if (isMoving) {
							this.value.set(0);
							return;
						}
						this.value.set(-1 * config.speed);
					}

					return;
				}

				// Basic logic
				if (isIncreasing && isDecreasing) {
					// Reset
					this.value.set(0);
				} else if (isIncreasing) {
					// Increase
					this.value.set(config.speed);
				} else if (isDecreasing) {
					// Decrease
					this.value.set(-1 * config.speed);
				} else {
					// Reset
					this.value.set(0);
				}
			};

			const controller = new KeyPressingDefinitionsController({
				thrustAdd: {
					key: config.rotate_add,
					conflicts: "down",
					keyDown: () => (isIncreasing = true),
					keyUp: () => (isIncreasing = false),
				},
				thrustSub: {
					key: config.rotate_sub,
					conflicts: "up",
					keyDown: () => (isDecreasing = true),
					keyUp: () => (isDecreasing = false),
				},
			});

			this.add(controller);
			this.event.subscribeObservable(controlsEnabled, (enabled) =>
				enabled ? controller.enable() : controller.disable(),
			);
			this.event.subscribeObservable(controlsEnabled, (enabled) => print("enabled? " + enabled));

			this.event.onInputBegin(update);
			this.event.onInputEnd(update);
		}
	}
}
