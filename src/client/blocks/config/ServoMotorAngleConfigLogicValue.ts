import { KeyDefinitions, KeyPressingDefinitionsController } from "client/base/KeyPressingController";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ServoMotorAngleConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["servoMotorAngle"]
> {
	constructor(
		config: BlockConfigDefinitionRegistry["servoMotorAngle"]["config"],
		definition: BlockConfigDefinitionRegistry["servoMotorAngle"],
	) {
		super(config, definition);
		this.value.set(0);

		const def = {
			add: {
				key: config.rotation.add,
				conflicts: "sub",
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
			sub: {
				key: config.rotation.sub,
				conflicts: "add",
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
		} as const satisfies KeyDefinitions<"add" | "sub">;

		this.add(new KeyPressingDefinitionsController(def));
	}
}
