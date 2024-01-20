import { KeyDefinitions, KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ThrustConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["thrust"]> {
	private readonly controller;

	constructor(
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigDefinitionRegistry["thrust"],
	) {
		super(config, definition);

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
		return new NumberObservableValue(this.definition.default, 0, 100, 0.01);
	}
}
