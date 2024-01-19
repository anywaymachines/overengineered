import Control from "client/base/Control";
import { KeyDefinitions, KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import TouchModeButtonControl from "client/gui/ridemode/TouchModeButtonControl";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MotorRotationSpeedConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["motorRotationSpeed"]
> {
	private readonly controller;

	constructor(
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigDefinitionRegistry["motorRotationSpeed"],
	) {
		super(config, definition);
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

		this.add((this.controller = new KeyPressingDefinitionsController(def)));
	}

	getRideModeGuis(inputType: InputType): readonly Control[] {
		if (inputType !== "Touch") return super.getRideModeGuis(inputType);

		const add = TouchModeButtonControl.create();
		add.text.set(this.config.rotation.addTouchName);
		add.subscribe(
			() => this.controller.controller.keyDown("add"),
			() => this.controller.controller.keyUp("add"),
			() => this.controller.controller.isDown("add"),
			this.config.switchmode,
		);

		const sub = TouchModeButtonControl.create();
		sub.text.set(this.config.rotation.subTouchName);
		sub.subscribe(
			() => this.controller.controller.keyDown("sub"),
			() => this.controller.controller.keyUp("sub"),
			() => this.controller.controller.isDown("sub"),
			this.config.switchmode,
		);

		return [add, sub];
	}
}
