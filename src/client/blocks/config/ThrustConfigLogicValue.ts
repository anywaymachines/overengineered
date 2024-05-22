import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import type { KeyDefinitions } from "client/controller/KeyPressingController";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";
import type { ObservableValue } from "shared/event/ObservableValue";

export class ThrustConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Thrust> {
	private readonly controller;

	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Thrust["default"]>,
		config: BlockConfigTypes.Thrust["config"],
		definition: BlockConfigTypes.Thrust,
	) {
		super(observable, config, definition);

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

		const def = {
			add: {
				key: config.thrust.add,
				conflicts: "sub",
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
			sub: {
				key: config.thrust.sub,
				conflicts: "add",
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
		} as const satisfies KeyDefinitions<"add" | "sub">;

		this.add((this.controller = new KeyPressingDefinitionsController(def)));
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [
			{
				name: this.config.thrust.add,
				press: () => this.controller.controller.keyDown("add"),
				release: () => this.controller.controller.keyUp("add"),
				isPressed: () => this.controller.controller.isDown("add"),
				toggleMode: false,
			},
			{
				name: this.config.thrust.sub,
				press: () => this.controller.controller.keyDown("sub"),
				release: () => this.controller.controller.keyUp("sub"),
				isPressed: () => this.controller.controller.isDown("sub"),
				toggleMode: false,
			},
		];
	}

	protected createObservable(): ObservableValue<number> {
		return new NumberObservableValue<number>(0, 0, 100, 0.01);
	}
}
