import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class OrMotorAngleConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["or"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["or"]["config"],
		definition: BlockConfigDefinitionRegistry["or"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
