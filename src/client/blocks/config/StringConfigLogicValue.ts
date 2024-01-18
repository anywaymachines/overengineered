import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class StringConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["string"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["string"]["config"],
		definition: BlockConfigDefinitionRegistry["string"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
