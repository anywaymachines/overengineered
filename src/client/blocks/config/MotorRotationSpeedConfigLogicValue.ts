import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import type { KeyDefinitions } from "client/controller/KeyPressingController";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

export class MotorRotationSpeedConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.MotorRotationSpeed> {
	private readonly controller;

	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.MotorRotationSpeed["default"]>,
		config: BlockConfigTypes.MotorRotationSpeed["config"],
		definition: BlockConfigTypes.MotorRotationSpeed,
	) {
		super(observable, config, definition);
		this.value.set(0);

		const def = {
			add: {
				key: config.rotation.add,
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
				key: config.rotation.sub,
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

		this.parent((this.controller = new KeyPressingDefinitionsController(def)));
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [
			{
				name: this.config.rotation.add,
				press: () => this.controller.controller.keyDown("add"),
				release: () => this.controller.controller.keyUp("add"),
				isPressed: () => this.controller.controller.isDown("add"),
				toggleMode: this.config.switchmode,
			},
			{
				name: this.config.rotation.sub,
				press: () => this.controller.controller.keyDown("sub"),
				release: () => this.controller.controller.keyUp("sub"),
				isPressed: () => this.controller.controller.isDown("sub"),
				toggleMode: this.config.switchmode,
			},
		];
	}
}
