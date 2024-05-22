import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import type { KeyDefinitions } from "client/controller/KeyPressingController";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";
import type { ObservableValue } from "shared/event/ObservableValue";

export class ControllableNumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.ControllableNumber> {
	private readonly controller;

	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.ControllableNumber["default"]>,
		config: BlockConfigTypes.ControllableNumber["config"],
		definition: BlockConfigTypes.ControllableNumber,
	) {
		super(observable, config, definition);

		this.value.set(config.value);
		let amount = config.value;
		let movingUp = false;
		let movingDown = false;

		const update = () => this.value.set(amount);
		const start = (up: boolean) => {
			spawn(() => {
				const step = (definition.max - definition.min) / 100;
				while (up ? movingUp : movingDown) {
					const p = up ? step : -step;
					if (amount + p >= definition.min && amount + p <= definition.max) {
						amount += p;
						update();
					}

					wait(0.05);
				}
			});
		};

		const def = {
			add: {
				key: config.control.add,
				conflicts: "sub",
				keyDown: () => {
					if (movingUp) return;

					movingUp = true;
					start(true);
				},
				keyUp: () => {
					movingUp = false;
				},
			},
			sub: {
				key: config.control.sub,
				conflicts: "add",
				keyDown: () => {
					if (movingDown) return;

					movingDown = true;
					start(false);
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
				name: this.config.control.add,
				press: () => this.controller.controller.keyDown("add"),
				release: () => this.controller.controller.keyUp("add"),
				isPressed: () => this.controller.controller.isDown("add"),
				toggleMode: false,
			},
			{
				name: this.config.control.sub,
				press: () => this.controller.controller.keyDown("sub"),
				release: () => this.controller.controller.keyUp("sub"),
				isPressed: () => this.controller.controller.isDown("sub"),
				toggleMode: false,
			},
		];
	}

	protected createObservable(): ObservableValue<number> {
		return new NumberObservableValue<number>(
			this.config.value,
			this.definition.min,
			this.definition.max,
			this.definition.step,
		);
	}
}
