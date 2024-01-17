import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["bool"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigDefinitionRegistry["bool"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
